import { workspace } from "vscode";

export const getConfig: () => {
  enable: false
} | { enable: true, enableGitHook: boolean, startWorkHour: number, startWorkMin: number, endWorkHour: number, endWorkMin: number, endingHours: number, startSeconds: number, endSeconds: number } = () => {
  const get = <T>(section: string) => workspace.getConfiguration().get<T>(section);
  let enable = get<boolean>('noInvolution.enable')!;
  if (!enable) {
    return { enable };
  }

  const enableGitHook = get<boolean>('noInvolution.enableGitHook')!;

  const startWorkHour = get<number>('noInvolution.startWorkHour')!;
  const startWorkMin = get<number>('noInvolution.startWorkMin')!;

  const endWorkHour = get<number>('noInvolution.endWorkHour')!;
  const endWorkMin = get<number>('noInvolution.endWorkMin')!;

  const endingHours = get<number>('noInvolution.endingHours')!;
  const startSeconds = startWorkHour * 3600 + startWorkMin * 60;
  const endSeconds = endWorkHour * 3600 + endWorkMin * 60;
  if (endSeconds <= startSeconds || endSeconds - startSeconds < endingHours * 3600 || endingHours >= 24) {
    // 如果结束时间比开始时间小，或者开始时间与结束时间的区间比收尾阶段短，那么直接设置为不可用
    enable = false;
    return { enable };
  }
  return { enable, enableGitHook, startWorkHour, startWorkMin, endWorkHour, endWorkMin, endingHours, startSeconds, endSeconds };
};