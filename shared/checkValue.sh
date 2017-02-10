#!/bin/bash

ACTIVE_QPKG=`/sbin/getcfg MediaScraper Movie -u -f /etc/config/medialibrary.conf`
if [[ "${ACTIVE_QPKG}" = "NOTOFFICIALIMDB" ]]; then
    /usr/local/medialibrary/bin/mymediadbcmd setScraper -c 1 -n IMDB
fi
