#!/bin/bash
#
# Simple init script for managing a RapidContext server.
#
# Install with symlink:
#   ln -s /opt/rapidcontext/share/init/init.sh /etc/init.d/rapidcontext
#
# The symlink created above is used to determine the location of
# the server base directory. If installed some other way, make
# sure to modify this script accordingly.
#
# The server process will be run as the user that owns the server
# base directory.
#
# Multiple installations is supported by having separate base
# application directories only.
#


#
# Parse command-line arguments
#
USAGE="Usage: $0 {start|stop|restart|status}"
if [ $# != 1 ] ; then
    echo $USAGE >&2
    exit 1
fi
PROGRAM="$0"
COMMAND="$1"
SYMLINK="$PROGRAM"
while [ "$SYMLINK" != "" ] ; do
    cd `dirname $SYMLINK`
    PROGRAM=`pwd -P`/`basename $SYMLINK`
    SYMLINK=`readlink $PROGRAM`
done


#
# Locate base directory & files
#
cd `dirname $PROGRAM`/../..
BASEDIR=`pwd -P`
FILEATTR=(`ls -l plugin/system.zip`)
USER=${FILEATTR[2]}
GROUP=${FILEATTR[3]}
VARDIR=$BASEDIR/var
PIDFILE=$VARDIR/server.pid
LOGFILE=$VARDIR/server.`date +"%Y%m%d"`.log


#
# Checks if the server is running
#
is_running() {
    if [ -e $PIDFILE ]; then
        PID=`cat $PIDFILE`
        if [ -n "$PID" ] && ps -p $PID >/dev/null; then
            return 0
        else
            rm -f $PIDFILE
        fi
    fi
    return 1
}


#
# Starts the server if it isn't running
#
start() {
    echo -n $"Starting RapidContext... "
    if is_running ; then
        echo "FAILED, process already running"
        return 1
    else
        mkdir -p $VARDIR
        touch $PIDFILE
        # TODO: rotate log file
        touch $LOGFILE
        chown -R $USER:$GROUP $VARDIR
        su - $USER -c "PIDFILE=$PIDFILE LOGFILE=$LOGFILE $BASEDIR/bin/rapidcontext --server" &
        sleep 3
        if is_running; then
            echo "OK"
            return 0
        else
            echo "FAILED, process not running"
            return 1
        fi
    fi
}


#
# Stops the server if it is running
#
stop() {
    echo -n $"Stopping RapidContext... "
    if is_running ; then
        PID=`cat $PIDFILE`
        kill $PID
        SECS=0
        while [ $SECS -lt 10 ] && is_running ; do
            let SECS++
            sleep 1
        done
        if is_running ; then
            echo -n "using forced kill..."
            kill -9 $PID
            sleep 3
        fi
        if is_running ; then
            echo "FAILED, process $PID still running"
            return 1
        else
            rm -f $PIDFILE
            echo "OK"
            return 0
        fi
    else
        echo "FAILED, process not running"
        return 1
    fi
}


#
# Checks the status of the server
#
status() {
    echo -n $"RapidContext... "
    if is_running ; then
        echo "RUNNING"
        return 0
    else
        echo "NOT RUNNING"
        return 1
    fi
}


#
# Switch on the init command
#
case "${COMMAND}" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        start
        ;;
    status)
        status
        ;;
    *)
        echo $USAGE >&2
        exit 1
esac
