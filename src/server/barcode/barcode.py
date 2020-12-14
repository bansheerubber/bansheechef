import json
import cv2
import numpy as np

from pyzbar import pyzbar
from pyzbar.pyzbar import ZBarSymbol

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
	
	if len(found) != 0:
		print("found by simple")
	
	return found

def simple_detection(frame, already_detected):
	im = frame.copy()
	im = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)

	barcodes = pyzbar.decode(im)
	found = visualize_barcode(frame, barcodes, already_detected)
	return (found, im)


def complex_detection(frame, already_detected):
	im = frame.copy()

	gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
	im = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (1, 21)))

	dens = np.sum(gray, axis=0)
	mean = np.mean(dens)
	for idx, val in enumerate(dens):
		if val < 10800:
			im[:, idx] = 0

	(_, im) = cv2.threshold(im, 128, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

	barcodes = pyzbar.decode(im)
	found = visualize_barcode(frame, barcodes, already_detected)

	if len(found) != 0:
		print("found by complex")

	return (found, im)

class VideoTransformTrack(MediaStreamTrack):
	kind = "video"

	def __init__(self, track):
		super().__init__()
		self.track = track
		print("created video transform track")
	
	async def recv(self):
		original_frame = await self.track.recv()
		frame = original_frame.to_ndarray(format="bgr24")

		detected1, im1 = simple_detection(frame, [])

		return original_frame

async def barcode_offer(request):
	values = await request.post()
	
	rtc_sdp = values["sdp"]
	rtc_type = values["type"]

	offer = RTCSessionDescription(sdp=rtc_sdp, type=rtc_type)

	rtc_peer = RTCPeerConnection()

	@rtc_peer.on("datachannel")
	def on_datachannel(channel):
		@channel.on("message")
		def on_message(message):
			print("puking")
	
	@rtc_peer.on("iceconnectionstatechange")
	def on_iceconnectionstatechange():
		print("ICE connection state is %s", rtc_peer.iceConnectionState)

	@rtc_peer.on("track")
	def on_track(track):
		# handle video tracks
		if track.kind == "video":
			rtc_peer.addTrack(VideoTransformTrack(track))

		@track.on("ended")
		def on_ended():
			print("track ended")

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