#!/bin/zsh
# set -o allexport
# source .env
# set +o allexport

# https://www.cyberciti.biz/faq/bash-check-if-string-starts-with-character-such-as/

while read line;
do
if [[ $line == "#"* ]] || [[ $line == "" ]] || [[ $line == "DEV_"* ]] || [[ $line == "NODE_ENV"* ]] ;
then
    echo "skipping comment or empty line or dev/local env";
else
    echo "writing" $line;
    # heroku config:set GITHUB_USERNAME=joesmith
    heroku config:set $line
fi

done<.env

# file permission https://askubuntu.com/a/409031