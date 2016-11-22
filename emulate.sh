#!/bin/bash
# Manually emulate ionic/cordova application
# Chris Witko @ 2016 

echo "Emulating..."
cd ./platforms/ios/build/emulator
var=$(pwd)

ios-sim launch "$var"/*.app
