#!/usr/bin/env bash

curl -X POST -H "Content-Type: application/json" -d '{
  "setting_type":"call_to_actions",
  "thread_state":"new_thread",
  "call_to_actions":[
    {
      "payload":"START_BOT"
    }
  ]
}' "https://graph.facebook.com/v2.6/me/thread_settings?access_token=EAAEMZAWWAvGEBAFN4NwsZAhcIWvi510sbZBzsPJvZBzZAr3BJShSTNGLzYloREtHuZC9GCZAmzhl0cKP3KuDquMA0zCiQPZCsqcWLaZCYaN5Ubp2Sfy3ZCO8NFWQkZBCxPwiVaLws3V3hqQoU7ZCpFsBaWYQBwXGE1z6jIfe2tvP6Mnk0wZDZD"
