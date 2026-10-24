// 길이 균형 2차 보정: 정답 길이가 두드러진 몇 개 턴만 추가로 다듬는다. (tune.js, tune2.js 위에 덮어쓴다)
export const BEST3 = {
  c7c: {
    0: ['"Thanks for thinking of me. My plate is full with the Q3 report and the vendor review. Could we look at priorities together?"', '"저를 생각해 주셔서 고마워요. 지금 3분기 보고서와 공급업체 검토로 꽉 차 있어요. 우선순위를 같이 볼 수 있을까요?"'],
    1: ['"Sure. The Q3 report is due Friday, the vendor review next week, and training on the 20th. Which one should slip if I add the survey?"', '"네. 3분기 보고서는 금요일, 공급업체 검토는 다음 주, 교육은 20일이에요. 설문을 넣으면 어느 것을 미룰까요?"'],
  },
};
export const EXTRA3 = {
  n5a: { 2: ['연봉을 조금만 더 올려 주실 수 있을까요? 지금 제시하신 조건이 제 기대와는 조금 거리가 있어서요. 가능한 범위가 있을까요?', '연봉 7,000이 안 되면 입사하기 어렵습니다. 그보다 낮은 금액이라면 이번 오퍼는 정중히 거절하겠습니다.'] },
  n5c: { 2: ['대략 500만원 정도는 생각하고 있어요. 범위에 따라 조정은 이야기해 볼 수 있지만 대체로 그 정도입니다.', '최소 700만원은 주셔야 합니다. 그 아래 금액이라면 저는 이 일을 맡지 않겠습니다.'], 4: ['네, 그렇게 하기로 하죠. 구체적인 내용은 이후에 천천히 정리해서 이야기하는 걸로 하겠습니다.', '처음부터 이렇게 접근하셨으면 이렇게 오래 걸리지 않았을 텐데요. 시간이 많이 낭비됐네요.'] },
  c6b: { 1: ['네, 원래 그래요. 바쁠 땐 항상 이렇게 짧게 쓰는 편이라서, 습관이라 어쩔 수 없어요.', '메신저는 원래 짧은 거예요. 말투 하나하나에 감정을 읽으려 하지 말고 신경 쓰지 마세요.'] },
  n5e: { 2: [['"Okay, $4,500 is fine, I suppose. We can agree to that today and move on."', '"알겠어요, 4,500달러면 괜찮겠죠. 오늘 합의하고 넘어갈 수 있어요."'], ['"Still too high. Take it or leave it — $4,300 is my final number, and I won\'t discuss it further."', '"아직 비싸요. 받아들이든 말든 하세요. 4,300달러가 최종이고 더는 논의하지 않겠어요."']] },
  c7a: { 4: [['"Nice meeting you, Alex. Have a good evening, and enjoy the rest of the party. Bye for now."', '"만나서 반가웠어요, Alex. 좋은 저녁 보내시고 파티 즐기세요. 그럼 안녕."'], ['"Okay. I\'ll go now. I have a few things to do tomorrow, so I should probably leave."', '"알겠어요. 이제 갈게요. 내일 할 일이 좀 있어서 가야 할 것 같아요."']] },
  c7b: {
    1: [['"Tuesday is difficult for us. The review takes some time, and I\'m not sure we can finish it by then."', '"화요일은 저희에게 어려워요. 리뷰에 시간이 걸려서 그때까지 끝낼 수 있을지 모르겠어요."'], ['"That is impossible. We can\'t do it by Tuesday, so there is really nothing to discuss on this."', '"불가능해요. 화요일까지는 못 하니 이 건은 더 논의할 게 없어요."']],
    2: [['"No, wait. Tom, hold on a second. I need to say something about that before we move on."', '"아니, 잠깐만요. Tom, 잠깐만요. 넘어가기 전에 그것에 대해 할 말이 있어요."'], ['(You talk over Tom.) "No, that\'s wrong! You can\'t skip the second round at all, it makes no sense!"', '(Tom의 말을 가로채며) "아니, 그건 틀렸어요! 2차 리뷰를 건너뛸 수는 절대 없어요, 말이 안 돼요!"']],
  },
  c7c: { 0: [['"I\'m too busy right now. I really can\'t take on anything else this month, so I have to say no, sorry."', '"지금 너무 바빠요. 이번 달엔 다른 일을 맡을 수 없어서 거절해야 해요, 미안해요."'], ['"Sure, no problem. (You feel stressed but agree to avoid conflict.) I\'ll find the time somehow, don\'t worry."', '"네, 문제없어요. (스트레스를 받지만 갈등을 피하려고 승낙한다.) 어떻게든 시간을 낼게요, 걱정 마세요."']],
    1: [['"I have a lot of things going on right now, including some deadlines that are coming up very soon this week."', '"지금 할 일이 많고 이번 주에 곧 다가오는 마감들도 있어요."'], ['"Everything is important. I can\'t drop anything, and I don\'t see how to fit another project into my week."', '"전부 중요해요. 아무것도 뺄 수 없고 이번 주에 다른 프로젝트를 어떻게 넣을지 모르겠어요."']] },
};
