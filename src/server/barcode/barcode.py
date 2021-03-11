import json
import cv2
import numpy as np
import imutils
import time

from pyzbar import pyzbar
from pyzbar.pyzbar import ZBarSymbol

from av import VideoFrame

from aiohttp import web
from aiortc import MediaStreamTrack, RTCPeerConnection, RTCSessionDescription

def visualize_barcode(im, barcodes, already_detected):
	found = []
	for barcode in barcodes:
		if barcode.data.decode("utf-8") in already_detected:
			continue
		
		points = barcode.polygon

		# If the points do not form a quad, find convex hull
		if len(points) > 4: 
			hull = cv2.convexHull(np.array([point for point in points], dtype=np.float32))
			hull = list(map(tuple, np.squeeze(hull)))
		else: 
			hull = points

		# Number of points in the convex hull
		n = len(hull)

		# Draw the convext hull
		for j in range(0,n):
			cv2.line(im, hull[j], hull[ (j+1) % n], (255,0,0), 3)
		
		(x, y, w, h) = barcode.rect
		text = "{} ({})".format(barcode.data.decode("utf-8"), barcode.type)
		cv2.putText(im, text, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
		already_detected.append(barcode.data.decode("utf-8"))

		found.append(barcode.data.decode("utf-8"))

	return found

def simple_detection(frame, already_detected):
	im = frame.copy()
	im = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)

	barcodes = pyzbar.decode(im)
	found = visualize_barcode(frame, barcodes, already_detected)

	if len(found) != 0:
		print("found by simple")

	return (found, im)

def dump(obj):
  for attr in dir(obj):
    print("obj.%s = %r" % (attr, getattr(obj, attr)))

def clamp(value, _min, _max):
	return max(min(value, _max), _min)

totals = {}
counts = {}

def mark(tag, start):
	current_time = time.time()
	difference = (current_time - start) * 1000

	if tag not in totals:
		totals[tag] = 0
		counts[tag] = 0
	
	totals[tag] = totals[tag] + difference
	counts[tag] = counts[tag] + 1

	print(tag, f"{totals[tag] / counts[tag]}ms")
	return current_time

"""
sobel 1.6064382329279063ms
thresh 0.1382590556631283ms
morph 1.4348474084114542ms
erode 0.3757105798137431ms
contours 0.3773557896516761ms
cropping 0.4199506068716244ms
barcodes 3.4942584378378734ms

on rpi4:
sobel: 22.5ms
thresh: 3ms
morph: 11ms
erode: 2.5ms
contours: 5ms
cropping: 1.5ms
barcodes: 14ms
"""
def process_frame(image):
	gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

	start = time.time()

	sobelx = np.array(
		(
			[3, 0, -3],
			[10, 0, -10],
			[3, 0, -3]
		),
		dtype="int"
	)

	sobely = np.array(
		(
			[3, 10, 3],
			[0, 0, 0],
			[-3, -10, -3]
		),
		dtype="int"
	)

	result1 = cv2.filter2D(gray, -1, sobelx)
	result2 = cv2.filter2D(gray, -1, sobely)
	result = cv2.subtract(result1, result2)

	start = mark("sobel", start)

	(_, thresh) = cv2.threshold(result, 225, 255, cv2.THRESH_BINARY)

	start = mark("thresh", start)

	result = cv2.morphologyEx(
		thresh,
		cv2.MORPH_CLOSE,
		cv2.getStructuringElement(cv2.MORPH_RECT, (25, 25))
	)
	start = mark("morph", start)
	result = cv2.erode(result, None, iterations=4)
	start = mark("erode", start)

	contours = cv2.findContours(result.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
	contours = imutils.grab_contours(contours)
	start = mark("contours", start)

	if len(contours) > 0:
		biggest = sorted(contours, key=cv2.contourArea, reverse=True)[0]
		box = np.int0(cv2.boxPoints(cv2.minAreaRect(biggest)))
		height, width = result.shape
		max_width = clamp(np.max(box[:, 0]), 0, width)
		max_height = clamp(np.max(box[:, 1]), 0, height)
		min_width = clamp(np.min(box[:, 0]), 0, width)
		min_height = clamp(np.min(box[:, 1]), 0, height)

		border = 20
		start_x = clamp(min_width - int(border / 2), 0, width)
		start_y = clamp(min_height - int(border / 2), 0, height)
		end_x = clamp(start_x + (max_width - min_width) + border, 0, width)
		end_y = clamp(start_y + (max_height - min_height) + border, 0, height)

		if max_height - min_height <= 0 or max_width - min_width <= 0:
			return (image, [])

		cropped = cv2.cvtColor(
			image[start_y:end_y, start_x:end_x],
			cv2.COLOR_RGB2GRAY
		)
		brightest = np.max(cropped)
		darkest = np.min(cropped)
		alpha = (255 + darkest) / brightest
		# cropped = cv2.addWeighted(cropped, alpha, cropped, 0, 0)
		start = mark("cropping", start)

		barcodes = pyzbar.decode(cropped)
		start = mark("barcodes", start)

		cv2.drawContours(image, [box], -1, (0, 255, 0), 3)
		
		if len(barcodes) > 0:
			return (image, [barcode.data.decode("utf-8") for barcode in barcodes])
		else:
			return (image, [])
	else:
		return (image, [])

class VideoTransformTrack(MediaStreamTrack):
	kind = "video"

	def __init__(self, session, track):
		super().__init__()
		self.track = track
		self.session = session
	
	async def recv(self):
		original_frame = await self.track.recv()
		# original_frame = await self.track.recv()
		# original_frame = await self.track.recv() # skip a frame for speed

		# skip frames if we start falling behind
		if self.track._queue.qsize() > 10:
			while self.track._queue.qsize() != 0:
				await self.track.recv()

		if self.session.barcode_scanning:
			frame = original_frame.to_ndarray(format="bgr24")
		
			# detected, im = simple_detection(frame, [])
			image, barcodes = process_frame(frame.copy())

			if self.session.data_channel and len(barcodes) > 0:
				self.session.data_channel.send(json.dumps({
					"found": barcodes,
				}))
				print(barcodes)
			
			new_frame = VideoFrame.from_ndarray(image, format="bgr24")
			new_frame.pts = original_frame.pts
			new_frame.time_base = original_frame.time_base
		
			return new_frame

		return original_frame

class RTCSession:
	def __init__(self, connection):
		self.connection = connection
		self.data_channel = None
		self.barcode_scanning = True

async def barcode_offer(request):
	values = await request.post()
	
	rtc_sdp = values["sdp"]
	rtc_type = values["type"]

	offer = RTCSessionDescription(sdp=rtc_sdp, type=rtc_type)

	rtc_peer = RTCPeerConnection()
	session = RTCSession(rtc_peer)

	rtc_peer.addTransceiver("video", "recvonly")

	@rtc_peer.on("datachannel")
	def on_datachannel(channel):
		session.data_channel = channel
		
		@channel.on("message")
		def on_message(message):
			if message == "start":
				session.barcode_scanning = True
			else:
				session.barcode_scanning = False

	@rtc_peer.on("track")
	def on_track(track):
		# handle video tracks
		if track.kind == "video":
			rtc_peer.addTrack(VideoTransformTrack(session, track))

		# @track.on("ended")
		# def on_ended():
		# 	print("track ended")

	# set the options that the client sent us
	await rtc_peer.setRemoteDescription(offer)

	answer = await rtc_peer.createAnswer()
	# reply to the client with the options we generated
	await rtc_peer.setLocalDescription(answer)

	return web.Response(
		content_type="application/json",
		text=json.dumps({
			"sdp": rtc_peer.localDescription.sdp,
			"type": rtc_peer.localDescription.type
		}),
	)