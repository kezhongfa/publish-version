# publish-version

- 用于自动执行版本控制和包发布任务的 CLI。

- 严格遵循 [Semantic Versioning](http://semver.org/lang/zh-CN/) 语义化版本规范。

## 安装

项目内安装

```bash
npm install publish-version -D

```

```js
{
  ...
  "scripts": {
    "release": "publish-version"
  },
  "devDependencies": {
    "publish-version": "*"
  }
  ...
}
```

全局安装

```bash
npm install publish-version -g
// 使用
npx pv

```

## 使用

### release(发版)

根据提示选择

```bash
publish-version
publish-version --preRelease  // beta版本选择
publish-version --preRelease=rc // rc版本选择

```

指定版本(如果此时版本为 0.0.1)

```bash
publish-version patch // 0.0.2
publish-version minor // 0.1.0
publish-version major // 1.0.0
publish-version 1.1.0 // 1.1.0

```

指定版本(如果此时版本为 0.0.1)

```bash
publish-version major --preRelease=beta // 1.0.0-beta.0
publish-version premajor --preReleaseId=beta --npm.tag=beta // 1.0.0-beta.0

```

### no publish(不发布)

```bash
publish-version --no-npm.skipCheck // no check(eg:用户是否是包合作者,用户是否登录,registry是否可用等)
publish-version --no-git.publish  // no publish
publish-version --no-npm // no check,publish

```

### no git project(非 git 项目) 或 no check,commit,push(git 不检查,提交,推送)

```bash
publish-version --no-git.skipCheck // no check(eg:是否是git仓库,是否是指定分支,是否工作区干净等)
publish-version --no-git.commit  // no commit
publish-version --no-git.push // no push
publish-version --no-git // no check,commit,push

```

### no update version(不更新版本)

```bash
publish-version --no-increment

```

### only changelog(仅更新 changelog)

```bash
publish-version --only-changelog
```

自定义配置

```js
{
"git": {
    "changelog": "npx auto-changelog --commit-limit false"
  },
  "hooks": {
      "afterVersion": "npx auto-changelog -p"
    }
}
```

## 默认值配置

项目有[默认配置](./src/config/publish-version.json)

我们可以通过设置,覆盖默认配置

- 项目根目录下(优先级:package.json>.publish-version.json>.publish-version.js)
- 也可指定配置文件`--config path/publish-version.json`

```js
{
"git": {
    "skipCheck": true
  },
  "npm": {
    "publishPath": "dist"
  }
}
```

## 变量(运行中提供的变量)

```js
version;
latestVersion;
name;
repo.remote, repo.protocol, repo.host, repo.owner, repo.repository, repo.project;
```

## hooks(运行过程中提供的钩子)

| 名称          |            含义 |
| :------------ | --------------: |
| beforeStart   |  npm,git 检查前 |
| afterStart    |  npm,git 检查后 |
| beforeVersion | 更新 version 前 |
| afterVersion  | 更新 version 后 |
| beforePublish |          发布前 |
| afterPublish  |          发布后 |

```js
{
  "hooks": {
    "beforeStart": "npm run codecheck",
    "afterStart": "echo afterStart",
    "beforeVersion": "echo ${name} current version ${latestVersion}",
    "afterVersion": "npx auto-changelog",
 "beforePublish": "echo before publish ${name} v${version}.",
    "afterPublish": "echo after publish ${name} v${version} to ${repo.repository}."
  }
}
```
