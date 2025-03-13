CLASP := npx clasp
JQ := jq
OPEN := open

.PHONY: status
status:
	@$(CLASP) status

.PHONY: deploy
deploy:
	@$(CLASP) push

.PHONY: open-gsheet
open-gsheet:
	@SHEET_ID=$$($(JQ) -r '.parentId[0]' < .clasp.json); \
	$(OPEN) "https://docs.google.com/spreadsheets/d/$$SHEET_ID/edit"

.PHONY: open-gas
open-gas:
	@$(CLASP) open
