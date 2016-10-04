#!/usr/bin/env bash
curl -X POST -H "Content-Type: application/json" -d '{
  "setting_type":"greeting",
  "greeting":{
    "text":"Salve! Eu sou o Deco do Programa Pense Grande. Tô aqui pra te mostrar 10 passos que vão ajudar você a tirar uma grana com o seu talento. Bora começar?"
  }
}' "https://graph.facebook.com/v2.6/me/thread_settings?access_token=EAAK9BYxZCXocBAKni5jZCLK7QjDVLaFaCr2rn5jydidcTeAYQ3fUatg3amVbsQtG2E96S6OUWdZCXnrluuMMq046ocWi64ZBUtUYgBHbVO9ayMabxwa87ZASBiAkZAJeLcm7cqQrfbLfHhWUTpSKOvo86sZA98smwd3jWMU1VNSNtZBiYf7RO4EJ"

