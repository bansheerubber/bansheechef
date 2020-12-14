import os

HOME = os.getenv("HOME")
LOCAL = os.path.join(HOME, ".config", "bansheechef")
LOCAL_STORAGE = os.path.join(LOCAL, "storage")
LOCAL_IMAGES = os.path.join(LOCAL_STORAGE, "images")

TEMPLATES = os.path.join(os.path.dirname(__file__), "templates")
STATIC = os.path.join(os.path.dirname(__file__), "static")