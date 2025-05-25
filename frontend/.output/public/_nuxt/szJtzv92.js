import{b3 as c,H as u,c as m,o as i,s as f,a as r,Y as t,t as s,F as g,v,B as h,by as y}from"./BG0I7BMR.js";import{s as b}from"./C8vTVB2U.js";var l=c(),T=({dt:e})=>`
.p-terminal {
    height: ${e("terminal.height")};
    overflow: auto;
    background: ${e("terminal.background")};
    color: ${e("terminal.color")};
    border: 1px solid ${e("terminal.border.color")};
    padding: ${e("terminal.padding")};
    border-radius: ${e("terminal.border.radius")};
}

.p-terminal-prompt {
    display: flex;
    align-items: center;
}

.p-terminal-prompt-value {
    flex: 1 1 auto;
    border: 0 none;
    background: transparent;
    color: inherit;
    padding: 0;
    outline: 0 none;
    font-family: inherit;
    font-feature-settings: inherit;
    font-size: 1rem;
}

.p-terminal-prompt-label {
    margin-inline-end: ${e("terminal.prompt.gap")};
}

.p-terminal-input::-ms-clear {
    display: none;
}

.p-terminal-command-response {
    margin: ${e("terminal.command.response.margin")};
}
`,w={root:"p-terminal p-component",welcomeMessage:"p-terminal-welcome-message",commandList:"p-terminal-command-list",command:"p-terminal-command",commandValue:"p-terminal-command-value",commandResponse:"p-terminal-command-response",prompt:"p-terminal-prompt",promptLabel:"p-terminal-prompt-label",promptValue:"p-terminal-prompt-value"},k=u.extend({name:"terminal",style:T,classes:w}),$={name:"BaseTerminal",extends:b,props:{welcomeMessage:{type:String,default:null},prompt:{type:String,default:null}},style:k,provide:function(){return{$pcTerminal:this,$parentInstance:this}}},L={name:"Terminal",extends:$,inheritAttrs:!1,data:function(){return{commandText:null,commands:[]}},mounted:function(){l.on("response",this.responseListener),this.$refs.input.focus()},updated:function(){this.$el.scrollTop=this.$el.scrollHeight},beforeUnmount:function(){l.off("response",this.responseListener)},methods:{onClick:function(){this.$refs.input.focus()},onKeydown:function(n){n.key==="Enter"&&this.commandText&&(this.commands.push({text:this.commandText}),l.emit("command",this.commandText),this.commandText="")},responseListener:function(n){this.commands[this.commands.length-1].response=n}}};function x(e,n,B,M,p,o){return i(),m("div",t({class:e.cx("root"),onClick:n[2]||(n[2]=function(){return o.onClick&&o.onClick.apply(o,arguments)})},e.ptmi("root")),[e.welcomeMessage?(i(),m("div",t({key:0,class:e.cx("welcomeMessage")},e.ptm("welcomeMessage")),s(e.welcomeMessage),17)):f("",!0),r("div",t({class:e.cx("commandList")},e.ptm("content")),[(i(!0),m(g,null,v(p.commands,function(a,d){return i(),m("div",t({key:a.text+d.toString(),class:e.cx("command"),ref_for:!0},e.ptm("commands")),[r("span",t({class:e.cx("promptLabel"),ref_for:!0},e.ptm("prompt")),s(e.prompt),17),r("span",t({class:e.cx("commandValue"),ref_for:!0},e.ptm("command")),s(a.text),17),r("div",t({class:e.cx("commandResponse"),"aria-live":"polite",ref_for:!0},e.ptm("response")),s(a.response),17)],16)}),128))],16),r("div",t({class:e.cx("prompt")},e.ptm("container")),[r("span",t({class:e.cx("promptLabel")},e.ptm("prompt")),s(e.prompt),17),h(r("input",t({ref:"input","onUpdate:modelValue":n[0]||(n[0]=function(a){return p.commandText=a}),class:e.cx("promptValue"),type:"text",autocomplete:"off",onKeydown:n[1]||(n[1]=function(){return o.onKeydown&&o.onKeydown.apply(o,arguments)})},e.ptm("commandText")),null,16),[[y,p.commandText]])],16)],16)}L.render=x;export{L as default};
