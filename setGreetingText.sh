#!/usr/bin/env bash
curl -X POST -H "Content-Type: application/json" -d '{
  "setting_type":"greeting",
  "greeting":{
    "text":"Olá! Eu sou o Deco, chega mais aí! Eu sou um robô trabalhado na sagacidade, que nasceu dentro do Programa Pense Grande, da Fundação Telefônica Vivo. Minha programação foi pensada pra te ajudar a fazer um corre. Clica nesse botão aí embaixo pra gente começar logo nosso papo!"
  }
}' "https://graph.facebook.com/v2.6/me/thread_settings?access_token=EAAEBuZAO0QT0BAABLvLXnrak42NxaZB91FDHWHP2oyRnYcfA6Qp0ZAmzOE1tcIFoNBaf6c9Na8TDySWcytjMsw3ZCMl2Uy98EBmoQKsikaUFGLTgpdvbCLcc08T4y5PhZCJEeof5ZAhecmVIkZByZA4VmyPaDaDnhHuEcOkOHjAZAQQZDZD"
