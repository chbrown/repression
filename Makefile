VERSION = $(shell jq -r '.version' < extension/manifest.json)
EXT_ZIP = extension-$(VERSION).zip

all: $(EXT_ZIP) static/lib.min.js static/lib.max.js

$(EXT_ZIP): extension/manifest.json
	zip -r $@ extension

# javascript compilation / reduction

VENDOR_JS = lodash angular angular-sanitize angular-ui-router ngStorage
LOCAL_JS = angular-plugins
JS_FILES_MIN = $(VENDOR_JS:%=static/lib/%.min.js) $(LOCAL_JS:%=static/lib/%.js)
JS_FILES_MAX = $(VENDOR_JS:%=static/lib/%.js) $(LOCAL_JS:%=static/lib/%.js)

static/lib.min.js: $(JS_FILES_MIN)
	closure-compiler --language_in ECMASCRIPT5 --warning_level QUIET --js $(JS_FILES_MIN) > $@

static/lib.max.js: $(JS_FILES_MAX)
	cat $(JS_FILES_MAX) > $@
