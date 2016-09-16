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
      "url":"http://google.com/?s=bora+pro+corre"
    },
    {
      "type":"postback",
      "title":"Progresso",
      "payload":"PROGRESS"
    },
    {
      "type":"postback",
      "title":"Ajuda",
      "payload":"HELP"
    }
    

  ]
}' "https://graph.facebook.com/v2.6/me/thread_settings?access_token=EAAK9BYxZCXocBAKni5jZCLK7QjDVLaFaCr2rn5jydidcTeAYQ3fUatg3amVbsQtG2E96S6OUWdZCXnrluuMMq046ocWi64ZBUtUYgBHbVO9ayMabxwa87ZASBiAkZAJeLcm7cqQrfbLfHhWUTpSKOvo86sZA98smwd3jWMU1VNSNtZBiYf7RO4EJ"
