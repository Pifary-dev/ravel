class Vector{
  constructor(x,y){
    this.x = x;
    this.y = y;
  }
}
var code = "0000"
var input = function(num) {
  var t = document.getElementsByClassName("pin-number-input")[num].value
  if (!Number.isInteger(Number(t))) {
    document.getElementsByClassName("pin-number-input")[num].value = "";
  }
}

var enter = function() {
  var t = document.getElementsByClassName("pin-number-input")
  var result = ""
  for (var i in t) {
    result+=t[i].value
  }
  console.log((code==result));
}

document.addEventListener("keydown", keydown, false);

function keydown(e) {
  if (e.keyCode == 222) {

  }
}
