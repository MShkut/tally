TALLY_VERSION := $(shell yq e ".version" manifest.yaml)
TALLY_ID := $(shell yq e ".id" manifest.yaml)
ARCH := $(shell uname -m)

.PHONY: all
all: verify

.PHONY: verify
verify: manifest.yaml
	@echo "Verifying manifest..."
	@yq e . manifest.yaml > /dev/null

.PHONY: install
install:
	@echo "Building Tally $(TALLY_VERSION) for $(ARCH)..."
	@mkdir -p docker-images

	# Build Docker image using existing Dockerfile
	docker buildx build --tag start9/$(TALLY_ID)/main:$(TALLY_VERSION) \
		--platform=linux/amd64 \
		-o type=docker,dest=docker-images/x86_64.tar \
		-f ../docker/Dockerfile ..

	@echo "Docker image exported to docker-images/x86_64.tar"
