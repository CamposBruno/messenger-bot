#!/usr/bin/env bash

curl -X POST -H "Content-Type: application/json" -d '{
  "setting_type" : "call_to_actions",
  "thread_state" : "existing_thread",
  "call_to_actions":[
    {
      "type":"web_url",
      "title":"Mapa Wi-fi aberto",
      "url":"http://wifilivre.sp.gov.br/"
    },
    {
      "type":"web_url",
      "title":"Bora pro corre",
      "url":"http://google.com/?s=bora+pro+corre"
    }

  ]
}' "https://graph.facebook.com/v2.6/me/thread_settings?access_token=EAAEBuZAO0QT0BAABLvLXnrak42NxaZB91FDHWHP2oyRnYcfA6Qp0ZAmzOE1tcIFoNBaf6c9Na8TDySWcytjMsw3ZCMl2Uy98EBmoQKsikaUFGLTgpdvbCLcc08T4y5PhZCJEeof5ZAhecmVIkZByZA4VmyPaDaDnhHuEcOkOHjAZAQQZDZD"
