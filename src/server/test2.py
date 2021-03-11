from imutils.video import VideoStream
from pyzbar import pyzbar
from pyzbar.pyzbar import ZBarSymbol
import numpy as np
import datetime
import imutils
import time
import cv2

vs = VideoStream("/dev/video0", resolution=(1280, 720)).start()

def clamp(value, _min, _max):
	return max(min(value, _max), _min)

def process_frame(image):
	gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

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
	(_, thresh) = cv2.threshold(result, 225, 255, cv2.THRESH_BINARY)

	result = cv2.morphologyEx(
		thresh,
		cv2.MORPH_CLOSE,
		cv2.getStructuringElement(cv2.MORPH_RECT, (25, 25))
	)
	result = cv2.erode(result, None, iterations=4)

	contours = cv2.findContours(result.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
	contours = imutils.grab_contours(contours)

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
			return (image, None)

		cropped = cv2.cvtColor(
			image[start_y:end_y, start_x:end_x],
			cv2.COLOR_RGB2GRAY
		)
		brightest = np.max(cropped)
		darkest = np.min(cropped)
		alpha = (255 + darkest) / brightest
		# cropped = cv2.addWeighted(cropped, alpha, cropped, 0, 0)

		barcodes = pyzbar.decode(cropped)
		cv2.drawContours(image, [box], -1, (0, 255, 0), 3)

		return (image, barcodes)
	else:
		return (image, None)

while True:
	# image = cv2.imread("test.png")
	image = vs.read()
	image, barcodes = process_frame(image)

	cv2.imshow("Image", image)
	
	key = cv2.waitKey(1) & 0xFF
	if key == ord("q"):
		break