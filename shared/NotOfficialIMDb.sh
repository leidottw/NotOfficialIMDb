#!/bin/sh

QPKG_CONFIG=/etc/config/qpkg.conf
MLIB_CONFIG=/etc/config/medialibrary.conf
VERSION=`/sbin/getcfg -f $QPKG_CONFIG NotOfficialIMDb version`
QPKG_PATH=`/sbin/getcfg -f $QPKG_CONFIG NotOfficialIMDb Install_Path`
NODE_PATH=`/sbin/getcfg -f $QPKG_CONFIG nodejs Install_Path`

action=$1

case $action in
    "start" )
        /sbin/setcfg NotOfficialIMDb Class MediaLibraryAddOn -f ${QPKG_CONFIG}
        /sbin/setcfg NotOfficialIMDb Type Movie -f ${QPKG_CONFIG}
        /sbin/setcfg NotOfficialIMDb LANG en -f ${MLIB_CONFIG}
        exit
        ;;
    "stop" )
        exit
        ;;
    "restart" )
        exit
        ;;
    * )
        $NODE_PATH/node/bin/node $QPKG_PATH/NotOfficialIMDb.js "$@"
        ;;
esac
