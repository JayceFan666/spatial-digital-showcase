# 空间数字展示与三维漫游 · Spatial Digital Showcase

面向商业空间、建筑、零售门店、广场与展览的 AI 辅助 3D 网页展示工具包。当空间仍在筹开或改造中，可以用浏览器带看，先讲清动线、空间关系和使用场景，再让观众自行探索细节。

AI-assisted 3D spatial presentation and digital walkthrough toolkit for commercial spaces, architecture, retail, plazas, and exhibitions. Launch the interactive demo, explore a five-scene guided tour, and reuse the camera, hotspot, visual direction, and production templates. To run locally, open `docs/index.html` in a WebGL-enabled browser.

## 体验 Demo

用支持 WebGL 的浏览器打开 [docs/index.html](docs/index.html) 的本地文件，或在仓库根目录启动静态服务器，再访问 `http://localhost:8000`。

```sh
python3 -m http.server 8000 --directory docs
```

点击「开始空间导览」，依次看全景、楼梯、退台、商业外摆和夜景。也可以拖动旋转、滚动或双指缩放，再点选场景节点。「氛围设置」支持季节、人流、顶棚、绿化和点位开关。导览支持手动翻幕、暂停和回到自由探索。

Demo 沿用实际项目网页的交互界面、镜头叙事和通用建模代码。公开版庭院轮廓、退台曲线和层高使用重新编写的展示坐标。场景和依赖都由仓库本地提供，页面无需账户或 API 密钥。部署 GitHub Pages 时可选 `main` 分支的 `/docs` 目录。

## 在新项目中复用

1. **核对资料**。说明展示目标、观众、入口、动线及必讲节点，确认公开范围。
2. **搭建空间**。按项目重做空间几何和尺度关系，先核对楼层、开口、连接关系，再补材质、植栽和家具。
3. **配置点位**。每个点位讲一件观众需要理解的事，配一个能看清实物关系的镜头。
4. **编排带看**。用全景建立方位，从主要动线进入，再安排停留、业态或夜间氛围等场景。根据项目调整分幕。
5. **检查交付**。在手机和桌面走完导览，核对镜头穿插、遮挡、交互和公开素材。

将 [skills/spatial-walkthrough](skills/spatial-walkthrough) 加入支持 SKILL.md 的开发代理，或让代理直接读取 [Skill 入口](skills/spatial-walkthrough/SKILL.md)。可从[项目任务书](skills/spatial-walkthrough/templates/brief.md)、[镜头与点位配置](skills/spatial-walkthrough/templates/scenes.json)和[视觉与交付检查表](skills/spatial-walkthrough/references/review.md)开始。Demo 的镜头和场景在 `docs/walkthrough.js`，样式在 `docs/style.css`。

## 需要准备的材料

提供用途、目标观众、空间关系、必讲点位、视觉参考和交付方式。如果已有可公开的照片、效果图或展示级模型，注明出处、许可与可用范围。项目图纸可作为本地建模的可选私有输入。每个项目的几何、材质和机位都需要按空间重新制作并核对。本工具包提供展示流程、交互示例和模板，CAD 自动转网页不在功能范围内。

## 隐私与发布

原始 CAD、项目源图纸、带尺寸的平面或剖面截图、内部资料及录屏始终留在本地，严禁提交到仓库。发布前还要检查注释、路径、链接、媒体元数据、资源包和模型属性。包含精确原图坐标、标高、尺寸表或专有图纸数据的模型应留在私有工作区。来源或公开权限存疑的资产先搁置。

```sh
python3 scripts/prepublish.py --tree
# git add 经过审核的发布文件后，再检查即将提交的内容
python3 scripts/prepublish.py
```

脚本筛查常见的私有文件、路径、内嵌资源和密钥。图片与视频的画面、模型数据及发布授权需要人工复核。

**检索关键词**　空间数字展示、三维空间漫游、数字带看、商业空间可视化、建筑交互展示、展览导览、热点标注、WebGL、Three.js、3D walkthrough、guided tour。

代码和工具包使用 MIT 许可。Three.js 与 OrbitControls 的版权和 MIT 许可随 `docs/vendor.js` 提供。
