#!/usr/bin/env bash
curl -X POST -H "Content-Type: application/json" -d '{
  "setting_type":"greeting",
  "greeting":{
    "text":"Salve! Eu sou o Deco do Programa Pense Grande. Tô aqui pra te mostrar 10 passos que vão ajudar você a tirar uma grana com o seu talento. Bora começar? Aperta o botão aqui embaixo!"
  }
}' "https://graph.facebook.com/v2.6/me/thread_settings?access_token=EAAEMZAWWAvGEBAFN4NwsZAhcIWvi510sbZBzsPJvZBzZAr3BJShSTNGLzYloREtHuZC9GCZAmzhl0cKP3KuDquMA0zCiQPZCsqcWLaZCYaN5Ubp2Sfy3ZCO8NFWQkZBCxPwiVaLws3V3hqQoU7ZCpFsBaWYQBwXGE1z6jIfe2tvP6Mnk0wZDZD"
