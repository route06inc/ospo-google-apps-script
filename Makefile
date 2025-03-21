MAKE := make
TARGETS := repo1 repo2

define make-r
	@for i in $(TARGETS); do \
		$(MAKE) -w -C $$i $(1) || exit $$?; \
	done
endef

# Recursive clasp status
.PHONY: status
status:
	$(call make-r, status)

# Recursive clasp push
.PHONY: deploy
deploy:
	$(call make-r, deploy)
