//  编译
class Comiler {
  /**
   * @param {Node,String} el 根元素
   * @param {*} vm vue实例
   */
  constructor(el, vm) {
    //  判断el属性,是否为元素,不是则querySelector获取实例
    //  el为挂载元素节点
    this.el = this.isElementNode(el) ? el : document.querySelector(el)
    this.vm = vm
    //  把当前节点中的元素 获取到 放到内存中
    let fragment = this.node2fragment(this.el)

    //  将节点中的内容进行替换

    //  编译模板 用数据编译
    this.compile(fragment)
    //  将内容塞到页面中
    this.el.appendChild(fragment)

  }
  //  是否为vue指令 v-model v-on
  isDirective (attrName) {
    return attrName.startsWith('v-')
  }
  //  编译元素 (v-model)
  compileElement (node) {
    //  拿到所有的属性
    let attributes = node.attributes;
    [...attributes].forEach(attr => {     //  type="text" v-model="school.age"

      //  attr type="text"      name:type value"text  
      let { name, value } = attr
      //  如果是指令
      if (this.isDirective(name)) {
        console.log(node, 'element')
      }
    })
  }

  //  编译文本 ( {{}} )
  //  判断当前文本节点内容中,是否包含 {{}}
  compileText (node) {
    let content = node.textContent

    //  通过正则拿到括号中间的值
    if (/\{\{(.+?)\}\}/.test(content)) {
      console.log(content)
    }
  }
  /**
   * 核心编译方法 编译内存中的dom节点
   * @param {*} vdom 
   */
  compile (vdom) {
    //  获取所有的节点(文本节点和元素节点)
    let childNodes = vdom.childNodes;
    //  遍历所有节点
    [...childNodes].forEach(child => {
      //  如果是一个元素
      if (this.isElementNode(child)) {
        //  使用元素编译方法
        this.compileElement(child)
        //  如果是元素的话,需要把自己传进去,再去遍历子节点(递归)
        this.compile(child)
      } else {
        //  使用文本编译方法
        this.compileText(child)
      }
    })
  }
  /**
   * 将节点放到内存中
   * @param {node} node 
   * @returns 真实dom的副本
   */
  node2fragment (node) {
    //  创建一个文档碎片
    let fragment = document.createDocumentFragment()
    //  第一个节点
    let firstChild;
    //  当node第一个存在,将第一个移动到fistChild并赋值
    while (firstChild = node.firstChild) {
      //  appendChild具有移动性,添加一个就移动一个
      fragment.appendChild(firstChild)
    }
    return fragment
  }
  /**
   * 是否为元素节点
   * @param {*} node 元素或字符串
   */
  isElementNode (node) {
    return node.nodeType === 1
  }
}

//  编译工具 (不同功能调用不同方法)
ComilerUtil = {
  model () {

  },
  html () {

  },
  text () {

  }
}

//  基类  调度
class Vue {
  constructor(options) {
    this.$el = options.el
    this.$data = options.data
    //  这个根元素 存在 编译模板
    //  el:"#app"
    if (this.$el) {
      new Comiler(this.$el, this)
    }
  }

}