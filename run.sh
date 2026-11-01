#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "================================================================================"
echo " 🚀 LAUNCHING LEARNIFY: MONGODB + PYMONGO ML & WEB APPLICATION"
echo "================================================================================"

python3 "$DIR/run.py"
