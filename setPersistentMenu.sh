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
      "title":"Site Pense Grande",
      "url":"http://fundacaotelefonica.org.br/pensegrande/"
    },
    {
      "type":"postback",
      "title":"Progresso",
      "payload":"PROGRESS"
    },
    {
      "type":"postback",
      "title":"Quem sou eu",
      "payload":"DECO"
    },

    {
      "type":"postback",
      "title":"Ajuda",
      "payload":"HELP"
    }


  ]
}' "https://graph.facebook.com/v2.6/me/thread_settings?access_token=EAAEMZAWWAvGEBAFN4NwsZAhcIWvi510sbZBzsPJvZBzZAr3BJShSTNGLzYloREtHuZC9GCZAmzhl0cKP3KuDquMA0zCiQPZCsqcWLaZCYaN5Ubp2Sfy3ZCO8NFWQkZBCxPwiVaLws3V3hqQoU7ZCpFsBaWYQBwXGE1z6jIfe2tvP6Mnk0wZDZD"
