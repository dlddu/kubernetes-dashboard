#!/bin/bash
# Test script for Docker build and basic functionality

set -e

echo "=== Docker Build Test ==="

# Test 1: Dockerfile should exist
echo "Test 1: Checking if Dockerfile exists..."
if [ ! -f Dockerfile ]; then
    echo "FAIL: Dockerfile not found"
    exit 1
fi
echo "PASS: Dockerfile exists"

# Test 2: Docker build should succeed
echo "Test 2: Building Docker image..."
if ! docker build -t kubernetes-dashboard:test . ; then
    echo "FAIL: Docker build failed"
    exit 1
fi
echo "PASS: Docker build succeeded"

# Test 3: Container should start
echo "Test 3: Starting container..."
CONTAINER_ID=$(docker run -d -p 8080:8080 kubernetes-dashboard:test)
if [ -z "$CONTAINER_ID" ]; then
    echo "FAIL: Container failed to start"
    exit 1
fi
echo "PASS: Container started with ID: $CONTAINER_ID"

# Wait for server to be ready
echo "Waiting for server to be ready..."
sleep 3

# Test 4: Health endpoint should respond
echo "Test 4: Testing /api/health endpoint..."
if ! curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "FAIL: Health endpoint not responding"
    docker logs $CONTAINER_ID
    docker stop $CONTAINER_ID
    docker rm $CONTAINER_ID
    exit 1
fi
echo "PASS: Health endpoint responding"

# Test 5: Health endpoint should return valid JSON
echo "Test 5: Validating health endpoint response..."
RESPONSE=$(curl -s http://localhost:8080/api/health)
if ! echo "$RESPONSE" | jq -e '.status == "ok"' > /dev/null 2>&1; then
    echo "FAIL: Invalid health response: $RESPONSE"
    docker stop $CONTAINER_ID
    docker rm $CONTAINER_ID
    exit 1
fi
echo "PASS: Health endpoint returns valid JSON"

# Test 6: Root path should serve index.html (SPA)
echo "Test 6: Testing SPA serving..."
if ! curl -f http://localhost:8080/ > /dev/null 2>&1; then
    echo "FAIL: Root path not serving content"
    docker logs $CONTAINER_ID
    docker stop $CONTAINER_ID
    docker rm $CONTAINER_ID
    exit 1
fi
echo "PASS: SPA is being served"

# Cleanup
echo "Cleaning up..."
docker stop $CONTAINER_ID
docker rm $CONTAINER_ID
docker rmi kubernetes-dashboard:test

echo ""
echo "=== All Docker tests passed! ==="
