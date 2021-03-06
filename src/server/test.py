# import the necessary packages
from imutils.video import VideoStream
from pyzbar import pyzbar
from pyzbar.pyzbar import ZBarSymbol
import numpy as np
import datetime
import imutils
import time
import cv2

vs = VideoStream("/dev/video0", resolution=(1280, 720)).start()
found = set()

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
			cv2.line(frame, hull[j], hull[ (j+1) % n], (255,0,0), 3)
		
		(x, y, w, h) = barcode.rect
		text = "{} ({})".format(barcode.data.decode("utf-8"), barcode.type)
		cv2.putText(frame, text, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
		already_detected.append(barcode.data.decode("utf-8"))

		found.append(barcode.data.decode("utf-8"))
	
	if len(found) != 0:
		print("found by simple")
	
	return found

def simple_detection(frame, already_detected):
	im = frame.copy()
	im = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)

	gradX = cv2.Sobel(im, ddepth=cv2.CV_32F, dx=1, dy=0, ksize=-1)
	gradY = cv2.Sobel(im, ddepth=cv2.CV_32F, dx=0, dy=1, ksize=-1)
	# subtract the y-gradient from the x-gradient
	gradient = cv2.subtract(gradX, gradY)
	gradient = cv2.convertScaleAbs(gradient)
	
	blurred = cv2.blur(gradient, (2, 2))
	(_, thresh) = cv2.threshold(blurred, 225, 255, cv2.THRESH_BINARY)
	kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (21, 21))
	closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
	closed = cv2.erode(closed, None, iterations = 8)

	# cnts = cv2.findContours(closed.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
	# cnts = imutils.grab_contours(cnts)
	# c = sorted(cnts, key = cv2.contourArea, reverse = True)[0]

	# rect = cv2.minAreaRect(c)
	# print(rect)
	# box = cv2.boxPoints(rect)
	# box = np.int0(box)

	# cv2.drawContours(closed, [box], -1, (0, 255, 0), 3)

	# barcodes = pyzbar.decode(im)
	# found = visualize_barcode(im, barcodes, already_detected)

	return ([], closed)

# loop over the frames from the video stream
image_type = True
while True:
	frame = vs.read()

	detected1, im1 = simple_detection(frame, [])

	if image_type:
		cv2.imshow("Barcode Scanner", frame)
	else:
		cv2.imshow("Barcode Scanner", im1)

	key = cv2.waitKey(1) & 0xFF

	if key == ord("q"):
		break
	
	if key == ord("a"):
		image_type = not image_type

cv2.destroyAllWindows()
vs.stop()