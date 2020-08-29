//  给数据加上劫持绑定,实现数据劫持功能
class Observer {
  constructor(data) {
    this.observer(data)
  }

  observer (data) {
    //  如果是对象才观察
    if (data && typeof data === 'object') {
      //  循环每一项,并给每一项加上劫持
      for (const key in data) {
        this.defineReactive(data, key, data[key])
      }
    }
  }
  defineReactive (obj, key, value) {
    //  递归
    this.observer(value)
    Object.defineProperty(obj, key, {
      get () {
        return value
      },
      //  设置新值
      set: (newval) => {
        // 如果新值与旧值不相等,就更新值
        if (newval !== value) {
          // 将新值重新绑定
          this.observer(newval)
          //  更新值
          value = newval
        }
      }
    })
  }
}


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

      //  attr: v-model="school.name"  
      //  name: v-model,expr:"school.name"  from attr
      let { name, value: expr } = attr
      console.log(attr)
      //  如果是指令
      if (this.isDirective(name)) {
        //  解构获取指令名 model html text
        let [, directive] = name.split('-')

        //  需要用不同的指令来处理
        ComileUtil[directive](node, expr, this.vm)
      }
    })
  }

  //  编译文本 ( {{}} )
  //  判断当前文本节点内容中,是否包含 {{}}
  compileText (node) {
    let content = node.textContent

    //  通过正则拿到括号中间的值
    if (/\{\{(.+?)\}\}/.test(content)) {
      // console.log(content)
      //  文本节点
      ComileUtil['text'](node, content, this.vm) //  {{a}} {{b}} 替换a和b
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
ComileUtil = {
  //  获取表达式的值方法  school.name => fish
  getValue (vm, expr) {
    return expr.split('.').reduce((data, curr) => data[curr], vm.$data)
  },
  /** 
   * @param {*} node 节点 
   * @param {*} expr 表达式 school.msg
   * @param {*} vm  实例 vm.data取值
   */
  model (node, expr, vm) {
    //  给输入框赋予value属性 node.value = xxx

    //  获取model的更新方法
    let fn = this.updater['modelUpdater']
    //  获取表达式值方法
    let value = this.getValue(vm, expr) //  返回 fish

    fn(node, value)
  },
  html () {
    //  node.innerHTML = xxx
  },
  text (node, expr, vm) {
    let fn = this.updater['textUpdater']
    //  获取到 {{a}}  括号中间的值
    let content = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      //  从vm中获取括号中的值
      return this.getValue(vm, args[1])
    })

    fn(node, content)
  },
  updater: {
    //  将数据插入到节点中
    modelUpdater (node, value) {
      node.value = value
    },
    htmlUpdater () {

    },
    //  处理文本节点
    textUpdater (node, value) {
      node.textContent = value
    }
  }
}

//  基类  调度``
class Vue {
  constructor(options) {
    this.$el = options.el
    this.$data = options.data
    //  这个根元素 存在 编译模板
    //  el:"#app"
    if (this.$el) {

      //  将数据 全部转换成用 Object.defineProperty定义
      new Observer(this.$data)

      //  编译
      new Comiler(this.$el, this)
    }
  }

}