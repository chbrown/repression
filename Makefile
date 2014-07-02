VERSION = $(shell jq -r '.version' < extension/manifest.json)
EXT_ZIP = extension-$(VERSION).zip

all: $(EXT_ZIP)

$(EXT_ZIP): extension/manifest.json
	zip -r $@ extension
