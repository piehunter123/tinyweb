
// TODO: when we delete a box, it still doesnt delete the variable/function

/// <reference path="index.ts"/> 
interface VariableLookup{[key:string]:number}
interface FunctionLookup{[key:string]:string}


// Declare JS objects
let variables={'e':Math.E,'pi':Math.PI} as VariableLookup
let functions={
  'exp1':"e^§1",
  "lg2":"Math.log(§1)/Math.log(§2)",
  "lg1":"Math.log(§1)",
  "nCk2":"fac§1/(fac(§1-§2)*fac(§2))",
} as FunctionLookup
let selectedLogIdx=-1

// Select HTML objects
const logBox=document.querySelector<HTMLUListElement>("#log-box")
const consoleForm=document.querySelector<HTMLInputElement>("#console-form")
const consoleInput=document.querySelector<HTMLInputElement>("#console-input")
const outputField=document.querySelector<HTMLParagraphElement>("#output-field")

consoleInput!.focus()
if(logBox) logBox.addEventListener("mousedown",(e)=>{
    e.preventDefault()
    if(selectedLogIdx>=0){
        if(consoleInput){
            consoleInput.focus()
            consoleInput.value=""
        }
        logBox.children[selectedLogIdx].classList.remove("selected")
    }
})

if(consoleForm && consoleInput) consoleForm.addEventListener("submit",(e)=>{
  e.preventDefault()
  inputReceived(consoleInput.value)
  consoleInput.value=""
})
if(consoleInput) consoleInput.addEventListener("keyup",(e)=>{
  inputReceived(consoleInput.value,false)
  if(e.key=="Delete"){
    if(selectedLogIdx>=0 && selectedLogIdx<logBox!.childElementCount){
        logBox!.removeChild(logBox!.children[selectedLogIdx])
        selectedLogIdx=-1
        consoleInput.value=""
        outputField!.innerHTML=""
    }
  }
})
function inputReceived(msg:string,printLog:boolean=true){
  if(msg[0]=="/"){
    //This is a direct command, we just eval
    if(printLog)eval(msg.substring(1))
    print(msg.substring(1),msg,printLog)
    return
  }
  if(msg.length==0){
    if(printLog)return
    else print("","",false)
    return
  }
  if(msg.includes("=") && !msg.includes("==")){
    msg=msg.replace(/(\d+)(pi|e)/gi, '($1*$2)');
    var s=msg.split("=")
    if(["sqrt","sin","cos","pi","e","i"].includes(s[0])){
        print("Error: illegal override: "+s[0]+"#red",msg,printLog)
      return
    }
    if(s[0].includes("(")){ //defining a function
      var argsString=s[0].split("(")[1]
      argsString=argsString.substring(0,clampedIndex(argsString,")",0))
      var args=argsString.replace(" ","").split(",")
      var funcDisplayName=s[0].split("(")[0]
      var funcString=s[1].replaceAll("^","**")
      print(mathString(s[0])+"<br><strong>:</strong>= "+mathString(s[1]),msg,printLog)
      if(printLog){
        eval(funcDisplayName+"=("+args+")=>"+funcString)
        eval("graphs['"+funcDisplayName+"']="+funcDisplayName)
        GraphViewRender(canvas,ctx!)
      }
      
      return
    }else{ //defining a variable
      var res1=myEvalFunc(s[1].replaceAll("^","**"))
      if(res1!="undefined"){
        variables[s[0]]=res1
        print(mathString(s[0])+"<br><strong>:</strong>= "+mathString(s[1]),msg,printLog)
      }else  print(mathString(s[0])+"<br><strong>:</strong>= undefined",msg,printLog)
      return
    }

  }else if(!msg.includes("# ")) try{
    var msgEval=msg.replace(/(\d+)(pi|e)/gi, '($1*$2)');
    var res=myEvalFunc(lookupVariables(msgEval).replaceAll("^","**"))
    var s1=msg.split("#")
    var msgOut=s1[0]
    if(res!="undefined") msgOut=mathString(s1[0])+"<br>= "+res
    if(s1.length>1)msgOut+="#"+s1[1]
    print(msgOut,msg,printLog)
    return
  }catch{}
  print(msg,msg,printLog)
}
function log(n:number){ return Math.log10(n)
}
function ln(n:number){return Math.log(n)
}
function lg(n:number,base:number){return Math.log(n)/Math.log(base)
}
function nCk(n:number,k:number){fac(n)/(fac(n-k)*fac(k))
}
let floor=(x:number)=>Math.floor(x)
let ceil=(x:number)=>Math.ceil(x)
let sign=(x:number)=>Math.sign(x)
let tan=(x:number)=>Math.tan(x)
let tanh=(x:number)=>Math.tanh(x)
let atan=(x:number)=>Math.atan(x)
let atanh=(x:number)=>Math.atanh(x)
function fac(n:number){
  if(n==0) return 1
  for(var i=n-1; i>0; i--) n*=i
  return n
}
function clampedIndex(msg:string,q:string,pos:number=0){
  var pos=msg.indexOf(q,pos)
  if(pos<0)return msg.length
  return pos
}
function myEvalFunc(msg:string):any{
  msg=msg.split("#")[0] // ignore styling 
  function parseSyntax(sqrt:string,mathsqrt:string){
    var i=0
    while(i>=0 && i<msg.length-sqrt.length){
      i=msg.indexOf(sqrt,i)
      if(i<0) break
      if(msg[i+sqrt.length]!='('){
        var nextOperator=msg.length
        const breakChars="+-*/() "
        for(var j=0; j<breakChars.length; j++)
          nextOperator=Math.min(clampedIndex(msg,breakChars[j],i+1+sqrt.length),nextOperator)
        msg=msg.substring(0,i)+mathsqrt+"("+msg.substring(i+sqrt.length,nextOperator)+")"+msg.substring(nextOperator)
      }else{
        msg=msg.substring(0,i)+mathsqrt+msg.substring(i+sqrt.length)
      }
      i+=mathsqrt.length
    }
  }
  parseSyntax("sqrt","Math.sqrt") ; parseSyntax("sin","Math.sin") ; parseSyntax("cos","Math.cos") ; parseSyntax("fac","fac") 
  var parIn=msg.split("(").length
  var parOut=msg.split(")").length
  try{
    if(parIn>parOut)
      for(;parOut<parIn; parOut++) msg+=")"
    else if(parIn<parOut)
      for(;parIn<parOut; parIn++) msg="("+msg
    return Math.round(eval(msg)*10000000)/10000000
  }catch{return "undefined"}
}

function lookupVariables(msg:string){
  msg=lookupFunctions(msg)
  var sorted = Object.keys(variables).sort((a, b) => b.length - a.length)
  for(const v in sorted)
    msg=msg.replaceAll(sorted[v],variables[sorted[v]].toString())
  return msg
}

function lookupFunctions(msg:string){
  var sorted = Object.keys(functions).sort((a, b) => b.length - a.length)
  for(const v in sorted){
    var q=sorted[v].substring(0,sorted[v].length-1)
    msg=replaceFunctionMsg(msg,q,parseInt(sorted[v].substring(sorted[v].length-1)),functions[sorted[v]])
  }
  return msg
}
function replaceFunctionMsg(msg:string,q:string,numArgs:number,r:string){
  var i=0
  while(i<msg.length){
    i=msg.indexOf(q,i)
    if(i<0)break
    var fStart=i
    i+=q.length+1
    var argsStart=i
    i=msg.indexOf(")",i)
    if(i<0)i=msg.length
    var args=msg.substring(argsStart,i).split(',')
    if(args.length==numArgs){
      for(var j=0; j<numArgs; j++)
        r=r.replaceAll("§"+(j+1),args[j])
      msg=msg.substring(0,fStart)+r+msg.substring(i+1)
      i+=r.length-(i-fStart)+1
    }
  }
  return msg
}

// whitespace between numbers and operators, and replaces * with dot
function mathString(msg:string){
  msg=msg.replaceAll("sinpi","sin pi").replaceAll("cospi","cos pi").replaceAll("sqrt","&radic;")
  const regex = /([-+*/^<>()|])/g;
  msg= msg.replace(regex, (match, operator) => {
  if (operator) {
    return ` ${operator} `;
  }
  return match;
  }).replaceAll("*","&middot;").replaceAll(",",", ");
  msg = msg.replace(/(?<!\w)e(?!w)/g, '<em>e</em>');
  msg = msg.replace(/(?<![a-zA-Z])pi(?![a-zA-Z])/g, 'π');
  
  return msg
}

// write to the log
function print(msg:string,msgOriginal:string,appendLog:boolean){
  var details=msg.split("#") // get styling
  if(msg.startsWith("## "))
    msg="<h3>"+details[2].substring(1)+"</h3>"
  else if(msg.startsWith("# "))
    msg="<h2>"+details[1].substring(1)+"</h2>"
  else msg=details[0]

  if(!logBox) return // angy >:(

  if(appendLog){
    if(selectedLogIdx>=0){ // update selected item
      var q1=logBox!.children[selectedLogIdx]
      q1.innerHTML=msg
      q1.setAttribute("value",msgOriginal)
      q1.setAttribute("color","")
      for(let i=1; i<details.length; i++) if(details[i].length>1 && details[i][0]!=" ")
        q1.setAttribute("color",details[i])
      logBox.children[selectedLogIdx].classList.remove("selected")
      selectedLogIdx=-1
    }else{ // create new item to hold the log
      var q = document.createElement("li")
      q.setAttribute("value",msgOriginal)
      q.setAttribute("color","")
      for(let i=1; i<details.length; i++) if(details[i].length>1 && details[i][0]!=" ")
      q.setAttribute("color",details[i])
      q.innerHTML=msg
      logBox.append(q)
      logBox.scrollTop = logBox.scrollHeight; // scroll latest into view
      q.addEventListener("click",(e)=>{
        consoleInput!.value=q.getAttribute("value")!
        if(selectedLogIdx>=0)
          logBox.children[selectedLogIdx].classList.remove("selected")
        selectedLogIdx=Array.from(logBox!.children).indexOf(q)
        logBox.children[selectedLogIdx].classList.add("selected")
        consoleInput!.focus()
      })
    }
  }else
    if(outputField) outputField.innerHTML=msg
}
