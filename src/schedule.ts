import { scheduleJob } from 'node-schedule';
import { workspace, window, Uri, Disposable } from 'vscode';
import { getConfig } from './getConfig';
import { getText } from './noInvolutionText';

export const subscribeSchedule = (config: ReturnType<typeof getConfig>) => {
  if (config.enable) {
    const { enableGitHook, startWorkHour, startWorkMin, endWorkHour, endWorkMin, endingHours, startSeconds, endSeconds } = config;
    const nowSeconds = new Date().getHours() * 3600 + new Date().getMinutes() * 60;
    let saveDisposable: Disposable | null = null;
    let statusBarTimer: NodeJS.Timeout | null = null;
    if (enableGitHook) {
      addPreCommit(startSeconds, endSeconds);
    } else {
      removePreCommit();
    }
    if (nowSeconds < startSeconds || nowSeconds >= endSeconds) {
      endCb();
    } else if (nowSeconds >= startSeconds && nowSeconds < endSeconds - endingHours * 3600) {
      startCb();
    } else if (nowSeconds >= endSeconds - endingHours * 3600 && nowSeconds < endSeconds) {
      endingCb();
    }

    scheduleJob(`0 ${startWorkMin} ${startWorkHour} * * *`, () => {
      startCb();
    });
    scheduleJob(`0 ${Math.floor((startSeconds + endingHours * 3600) / 3600)} ${((startSeconds + endingHours * 3600) % 3600) / 60} * * *`, () => {
      endingCb();
    });
    scheduleJob(`0 ${endWorkHour} ${endWorkMin} * * *`, () => {
      endCb();
    });
    function startCb() {
      statusBarTimer && clearInterval(statusBarTimer);
      window.setStatusBarMessage('');
      saveDisposable && saveDisposable.dispose();
    }

    function endingCb() {
      saveDisposable && saveDisposable.dispose();
      setStatusBar();
    }

    function endCb() {
      setStatusBar();
      saveDisposable = workspace.onDidSaveTextDocument(document => {
        console.log(workspace.name);
        showInputBox(document.uri);
        window.showInformationMessage('现在是下班时间！');
      });
    }

    function setStatusBar() {
      !statusBarTimer && (statusBarTimer = setInterval(() => {
        window.setStatusBarMessage(getText());
      }, 10000));
    }
  }
};



function showInputBox(uri: Uri) {
  window.showInputBox({
    placeHolder: '请输入工作区名称',
    prompt: '非工作时间必须要输入正确的工作区名称才能保存，否则会清空当前文件~'
  }).then(str => {
    if (str) {
      if (str !== workspace.name) {
        showInputBox(uri);
      }
    } else {
      workspace.fs.writeFile(uri, Buffer.from(''));
    }
  });
}

function addPreCommit(startSeconds: number, endSeconds: number) {
  if (workspace.workspaceFolders?.length) {
    const hooksUri = Uri.joinPath(workspace.workspaceFolders![0].uri, '/.git/hooks');
    workspace.fs.writeFile(Uri.joinPath(hooksUri, 'pre-commit'), Buffer.from(`#!/usr/bin/env node
const nowSeconds = new Date().getHours() * 3600 + new Date().getMinutes() * 60;
const startSeconds = ${startSeconds}
const endSeconds = ${endSeconds}
if (nowSeconds < startSeconds || nowSeconds > endSeconds) {
  console.error('当前是下班时间，您的代码已被禁止commit，请勿内卷')
  process.exit(1)
} else {
  process.exit(0)
}
        `));
  }
}
function removePreCommit() {
  if (workspace.workspaceFolders?.length) {
    const hooksUri = Uri.joinPath(workspace.workspaceFolders![0].uri, '/.git/hooks');
    workspace.fs.delete(Uri.joinPath(hooksUri, 'pre-commit'));
  }
}