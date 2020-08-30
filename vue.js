//  订阅 当数据变化,通知观察者更新
class Dep {
  constructor() {
    this.subs = []  //  存放所有的wathcer
  }
  //  订阅 添加 watcher
  addSub (watcher) {
    this.subs.push(watcher)
  }
  //  发布 更新
  notify () {
    this.subs.forEach(watcher => watcher.update())
  }
}

//  观察者 (发布订阅)
class Watcher {
  constructor(vm, expr, cb) {
    this.vm = vm
    this.expr = expr
    this.cb = cb
    //  默认存放一个老值
    this.oldValue = this.getVal()
  }
  //  获取旧的值
  getVal () {
    Dep.target = this   //  先把自己放在this上
    const value = ComileUtil.getValue(this.vm, this.expr)    //  取值,把观察者和数据关联起来
    Dep.target = null   //  释放内存    如果不取消,任何值取值都会添加watcher
    return value
  }
  //  更新操作 数据变化后 会调用观察者的update方法 
  update () {
    //  获取新的值
    let newval = ComileUtil.getValue(this.vm, this.expr)
    //  如果新值与旧值不相等 则调用回调方法
    if (newval !== this.oldValue) {
      this.cb(newval)
    }
  }
}

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
    //  给每个属性加上 具有发布订阅的 功能
    let dep = new Dep()
    //  给每个属性加上监听
    Object.defineProperty(obj, key, {
      get () {
        //  创建watcher时 会取到对应的内容,就会调用此方法
        //  并且把watcher放到了全局上,一取值就把watcher放到了Dep上面,值一改变就触发notify方法
        Dep.target && dep.addSub(Dep.target)

        return value
      },
      //  设置新值
      set: (newval) => {
        // 如果新值与旧值不相等,就更新值
        if (newval !== value) {

          this.observer(newval)   //  // 将新值重新绑定
          value = newval    //  更新值
          //  改变了一个新的值,就通知更新
          dep.notify()
        }
      }
    })
  }
}

//  编译
class Comiler {
  /**
   * @param {Node,String} el 根元素 el:#app
   * @param {*} vm vue实例 this
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
      // console.log(attr)
      //  如果是指令
      if (this.isDirective(name)) {
        //  解构获取指令名 model html text
        const [, directive] = name.split('-')

        //  存在v-on:click情况,需要再次解析  
        let [directiveName, eventName] = directive.split(':')

        //  需要用不同的指令来处理
        ComileUtil[directiveName](node, expr, this.vm, eventName)
      }
    })
  }

  //  编译文本 ( {{}} )
  //  判断当前文本节点内容中,是否包含 {{}}
  compileText (node) {
    let content = node.textContent

    //  通过正则拿到括号中间的值
    if (/\{\{(.+?)\}\}/.test(content)) {
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
  setValue (vm, expr, value) {
    expr.split('.').reduce((data, curr, index, arr) => {
      //  当取到 school.name时,直接赋新值
      if (arr.length - 1 === index) {
        return data[curr] = value
      }
      return data[curr]
    }, vm.$data)
  },
  //  v-on:click="change"     expr指change
  on (node, expr, vm, eventName) {
    node.addEventListener(eventName, (e) => {
      vm[expr].call(vm, e)  //  绑定this,此时this指node,需要指向vm
    })
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

    //  给输入框加一个观察者,如果数据更新了,会触发此方法
    //  方法会拿新的值给输入框赋值  (在数据内部添加一个观察者)
    new Watcher(vm, expr, newval => {
      fn(node, newval)
    })
    //  给节点增加一个事件监听
    node.addEventListener('input', (e) => {
      const value = e.target.value  //  获取当前用户输入的值
      this.setValue(vm, expr, value)  //  设置新的值
    })

    //  获取表达式值方法
    const value = this.getValue(vm, expr) //  返回 fish

    fn(node, value)
  },
  html (node, expr, vm) {   //  expr => v-html="message"  message
    let fn = this.updater['htmlUpdater']

    //  给输入框加一个观察者,如果数据更新了,会触发此方法
    //  方法会拿新的值给输入框赋值  (在数据内部添加一个观察者)
    new Watcher(vm, expr, newval => {
      fn(node, newval)
    })
    //  获取表达式值方法
    const value = this.getValue(vm, expr) //  返回 fish

    fn(node, value)
  },
  getContentValue (vm, expr) {
    //  遍历表达式 将内容 重新替换成 一个 完成的内容 返回回去 
    return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      return this.getValue(vm, args[1])
    })
  },
  text (node, expr, vm) {       //  {{a}} {{b}} => a b
    let fn = this.updater['textUpdater']
    //  获取到 {{a}}  括号中间的值
    let content = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      //  给表达式每个 {{}} 都加上 观察者  {{a}} {{b}}
      new Watcher(vm, args[1], () => {
        fn(node, this.getContentValue(vm, expr))   //  返回了一个全新的字符串
      })

      // 0: "{{school.name}}"
      // 1: "school.name"
      // 2: 0
      // 3: "{{school.name}}"
      return this.getValue(vm, args[1]) //  从vm中获取括号中的值
    })
    fn(node, content)
  },
  updater: {
    //  将数据插入到节点中
    modelUpdater (node, value) {
      node.value = value
    },
    //  处理v-html功能
    htmlUpdater () {
      node.innerHTML = value
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
    let computed = options.computed
    let methods = options.methods

    //  这个根元素 存在 编译模板
    //  el:"#app"
    if (this.$el) {

      //  将数据 全部转换成用 Object.defineProperty定义
      new Observer(this.$data)

      //  实现computed功能
      for (const key in computed) {     //  有依赖关系  数据
        //  不能代理到this,应该代理到$data
        Object.defineProperty(this.$data, key, {
          get: () => {
            //  取值时间是就是取函数的返回结果
            return computed[key].call(this)
          }
        })
      }

      //  实现methods功能
      for (const key in methods) {
        Object.defineProperty(this, key, {
          //  获取方法
          get () {
            return methods[key]
          }
        })
      }

      //  将vm上的取值操作 代理到 vm.$data中
      this.proxyVm(this.$data)

      //  编译
      new Comiler(this.$el, this)
    }
  }

  proxyVm (data) {
    for (const key in data) {   //  data :  school.name age
      Object.defineProperty(this, key, {
        get () {
          return data[key]    //  进行了转化操作
        },
        set (newval) {    //  设置代理方法
          data[key] = newval
        }
      })
    }
  }
}