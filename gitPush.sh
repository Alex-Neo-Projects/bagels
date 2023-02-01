#!/bin/bash

input="$*"

currentBranch=$(git branch --show-current)

git add .

git commit -m "$input"

git push --set-upstream origin "$currentBranch"