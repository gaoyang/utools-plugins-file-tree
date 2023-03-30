<template>
  <div>
    <div class="mainContainer">
      <el-card class="treeTextPanel">
        <code>{{ treeText }}</code>
      </el-card>
      <el-card class="settingPanel">
        <div>
          <el-switch v-model="options.dirsFirst"></el-switch>
          目录优先
        </div>
        <div>
          <el-switch v-model="options.dirsOnly"></el-switch>
          仅目录
        </div>
        <div>
          <el-switch v-model="options.allFiles"></el-switch>
          隐藏的文件
        </div>
        <div>
          <el-switch v-model="options.sizes"></el-switch>
          文件大小
        </div>
        <div>
          <el-switch v-model="options.reverse"></el-switch>
          反向排序
        </div>
        <div>
          <el-switch v-model="options.trailingSlash"></el-switch>
          目录反斜杠
        </div>
        <div>
          <el-switch v-model="options.ascii"></el-switch>
          ASCII 字符
        </div>
        <div>
          <span style="display: block; margin-top: 1rem">最大深度： {{ options.maxDepth }}</span>
          <el-slider v-model="options.maxDepth" :min="1" :max="20" :show-tooltip="false"></el-slider>
        </div>
        <div>
          <span style="display: block; margin-bottom: 1rem">正则排除</span>
          <el-input
            type="textarea"
            :rows="5"
            resize="none"
            placeholder="换行可以输入多个正则"
            v-model="regStr"></el-input>
        </div>
        <div style="text-align: center; margin: 1rem 0">
          <el-button type="primary" @click="copy">复 制</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.mainContainer {
  display: flex;
  height: 100vh;
  padding: 1rem;

  .treeTextPanel {
    @extend .panel;
    flex: 1;
    margin-right: 1rem;
    overflow: auto;
    code {
      display: inline-block;
      white-space: pre;
      word-break: normal;
      word-wrap: normal;
    }
  }
  .settingPanel {
    @extend .panel;
    flex: 0.4;
  }
}

.panel {
  border-radius: 0.5rem;
  padding: 0rem;
  // background: var(--color-card-bg);
  // box-shadow: var(--el-box-shadow-light);
}
</style>

<script lang="ts">
import { useDark } from '@vueuse/core'
import { defineComponent } from 'vue'
import { ElCard, ElSwitch, ElButton, ElSlider, ElInput } from 'element-plus'
import { TreeOptions } from './preload/generator'

useDark()

export default defineComponent({
  data() {
    return {
      path: '',
      treeText: 'loading...',
      regStr: '',
      options: {
        allFiles: false,
        dirsFirst: true,
        dirsOnly: false,
        sizes: false,
        reverse: false,
        trailingSlash: false,
        ascii: false,
        maxDepth: 5
      } as TreeOptions,
      timer: null as any
    }
  },
  components: {
    ElCard,
    ElSwitch,
    ElButton,
    ElSlider,
    ElInput
  },
  watch: {
    options: {
      handler() {
        this.loadTreeText()
      },
      deep: true
    },
    regStr() {
      ;(async () => {
        clearTimeout(this.timer)
        this.timer = setTimeout(() => {
          if (!this.regStr || this.regStr.trim() == '') this.options.exclude = []
          else
            this.options.exclude = this.regStr
              .split('\n')
              .filter(o => o.trim() != '')
              .map(o => new RegExp(o))
        }, 666)
      })()
    }
  },
  mounted() {
    window.addEventListener('tool-plugin-enter', this.enter)
  },
  methods: {
    async enter() {
      const self = this
      utools.setSubInput(
        (text: any) => {
          self.path = text.text
          self.loadTreeText()
        },
        '目录路径',
        false
      )
      this.path = await utools.readCurrentFolderPath()
      utools.setSubInputValue(this.path)
      this.loadTreeText()
    },
    copy() {
      utools.copyText(this.treeText)
      utools.showNotification('复制成功')
    },
    loadTreeText() {
      if (!window.preload) return
      console.log(this.path)
      const existed = this.path || window.preload.existsSync(this.path)
      if (!existed) {
        this.treeText = '目录不正确🙂'
        return
      }
      this.treeText = window.preload.generate(this.path, this.options)
    }
  },
  setup() {}
})
</script>
