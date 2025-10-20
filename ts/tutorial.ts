import { driver } from "driver.js";

import { ispy } from "./config.js";
import { getTutorialSteps } from "./tutorial-config.js";

export interface TutorialHooks {
  openPanel?: (id: string) => void;
  focusTool?: (tool: string) => void;
  highlightCanvasObject?: (id: number) => void;
  unhighlightAll?: () => void;
  sendAnalytics?: (event: string, payload?: any) => void;
}

export function startTutorial(key: string) {
  const tutorialSteps = getTutorialSteps(key, ispy.lang);

  const driverObj = driver({
    animate: false,
    showProgress: true,
    allowClose: false,
    overlayOpacity: 0.4,
    showButtons: ["next", "previous", "close"],
    nextBtnText: "<i class='fa fa-arrow-right'></i>",
    prevBtnText: "<i class='fa fa-arrow-left'></i>",
    doneBtnText: "<i class='fa fa-check'></i>",
    steps: tutorialSteps,
    disableActiveInteraction: true,
    allowKeyboardControl: false,
    onDestroyed: () => {
      //reload the page to reset the state
      window.location.reload();
    },
  });
  driverObj.drive();
}
