# import the necessary packages
from imutils.video import VideoStream
from pyzbar import pyzbar
from pyzbar.pyzbar import ZBarSymbol
import numpy as np
import datetime
import imutils
import time
import cv2

vs = VideoStream().start()
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

	barcodes = pyzbar.decode(im)
	found = visualize_barcode(im, barcodes, already_detected)
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
	found = visualize_barcode(im, barcodes, already_detected)

	if len(found) != 0:
		print("found by complex")

	return (found, im)


# loop over the frames from the video stream
while True:
	frame = vs.read()

	detected1, im1 = simple_detection(frame, [])
	detected2, im2 = complex_detection(frame, detected1)

	cv2.imshow("Barcode Scanner", frame)
	key = cv2.waitKey(1) & 0xFF

	if key == ord("q"):
		break

cv2.destroyAllWindows()
vs.stop()