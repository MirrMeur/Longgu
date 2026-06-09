import { z } from "zod";

export const GenreCardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  aliases: z.array(z.string().min(1)),
  generic: z.boolean().default(false),
  protagonistEngine: z.array(z.string().min(1)),
  payoffPatterns: z.array(z.string().min(1)),
  rhythm: z.array(z.string().min(1)),
  progression: z.array(z.string().min(1)),
  readerPitfalls: z.array(z.string().min(1)),
  endingHooks: z.array(z.string().min(1)),
  auditWeights: z.record(z.string(), z.number().min(0).max(10)),
  openingTenFocus: z.array(z.string().min(1)),
  promptHints: z.array(z.string().min(1))
});

export type GenreCard = z.infer<typeof GenreCardSchema>;

const cards = [
  {
    id: "xuanhuan",
    name: "玄幻",
    aliases: ["玄幻", "xuanhuan", "fantasy", "eastern-fantasy"],
    protagonistEngine: ["可见的境界/身份攀升", "资源稀缺下的突破", "受压后的公开反转"],
    payoffPatterns: ["境界突破", "资源夺取", "公开排名/测试逆转", "势力压迫后的反击"],
    rhythm: ["3-5 章内至少出现资源、身份、敌人适应或境界规则变化", "训练必须带外部时钟或公共压力"],
    progression: ["境界差异要改变能力、弱点和社会门槛", "敌人阶梯从家族/城池扩展到宗门/王朝/大陆"],
    readerPitfalls: ["战力膨胀但压力不变", "金手指过宽导致资源饥饿消失", "反派只有傲慢没有身份逻辑"],
    endingHooks: ["高阶人物察觉异常", "资源归属被挑战", "突破带来可见副作用", "公开测试条件突然变化"],
    auditWeights: { "power-resource-collapse": 10, "weak-payoff": 8, "weak-ending-hook": 8, "setting-conflict": 7 },
    openingTenFocus: ["主角压迫来源", "金手指边界", "第一条资源链", "公开比较场", "第一轮身份反转"],
    promptHints: ["重点检查境界、资源、势力阶梯和公开身份变化。", "修订时用身体压力、资源质感和旁观者反应承载爽点。"]
  },
  {
    id: "xianxia",
    name: "仙侠",
    aliases: ["仙侠", "xianxia", "cultivation"],
    protagonistEngine: ["长生/求道目标", "资源账本与因果债", "谨慎或执念驱动的修行选择"],
    payoffPatterns: ["瓶颈突破", "宝物/传承取得", "因果/誓言兑现或反噬", "宗门资源博弈"],
    rhythm: ["每个小段落应推进资源、因果、瓶颈或宗门利益", "突破必须伴随选择和后果"],
    progression: ["境界瓶颈关联资源、悟性、心魔、天劫或道途冲突", "胜利产生债、誓、敌意或天道/宗门注意"],
    readerPitfalls: ["修为只是数字", "道心/因果变成空话", "宗门政治缺少资源分配逻辑"],
    endingHooks: ["突破引来宗门注意", "誓言阻断最优解", "宝物认错主人", "交易隐藏代价暴露"],
    auditWeights: { "setting-conflict": 9, "power-resource-collapse": 9, "hook-omission": 7, "information-overreach": 6 },
    openingTenFocus: ["修行目标", "第一笔资源缺口", "宗门/散修生态", "金手指代价", "因果后患"],
    promptHints: ["重点检查资源账本、因果代价、宗门利益和突破后果。", "修订时用物件、誓纹、灵识、丹药消耗承载修行真实感。"]
  },
  {
    id: "urban",
    name: "都市",
    aliases: ["都市", "urban", "city"],
    protagonistEngine: ["现实身份反转", "钱/职位/专业能力兑现", "证据和社会关系推动"],
    payoffPatterns: ["合同签下", "债务清除", "诊断/证据公开", "职位或声誉翻转"],
    rhythm: ["每 3-5 章出现机构、证据、金钱、名誉或关系义务变化", "公开胜利必须留下现实痕迹"],
    progression: ["从个人困境进入公司、医院、学校、平台、司法等现实机构", "每次赢都制造法律、舆论或关系后果"],
    readerPitfalls: ["现实机构像道具", "用暴力/金钱无代价解决一切", "打脸无证据链和后续痕迹"],
    endingHooks: ["视频/合同/诊断/报警改变局面", "权威人物要求证明", "私人胜利公开化", "规则被反派反用"],
    auditWeights: { "setting-conflict": 9, "information-overreach": 8, "role-ooc": 7, "weak-payoff": 7 },
    openingTenFocus: ["现实困境", "第一件证据物", "机构约束", "钱/身份变化", "社会关系压力"],
    promptHints: ["重点检查钱、证据、合同、手机、监控、舆论和机构后果。", "修订时避免玄幻式战力压迫，改用现实证据和社会成本。"]
  },
  {
    id: "urban-system",
    name: "都市系统",
    aliases: ["都市系统", "urban-system", "urban system", "system-urban"],
    protagonistEngine: ["现实欲望线 + 系统任务/奖励", "系统能力必须落在现实机构和证据链里"],
    payoffPatterns: ["任务奖励改变现实选择", "技能在工作/商业/家庭/舆论场景兑现", "系统奖励制造新约束"],
    rhythm: ["系统任务、现实阻力、证据兑现、社会后果循环", "奖励预期要提前建立"],
    progression: ["能力升级不能跳过现实手续、名誉、法律和关系成本", "任务难度从个人到机构和平台扩展"],
    readerPitfalls: ["系统替代主角欲望", "奖励随意发放", "现实规则被系统一键抹除"],
    endingHooks: ["隐藏任务条件出现", "奖励预览改变优先级", "系统选择锁定路径", "现实证据反噬系统收益"],
    auditWeights: { "information-overreach": 8, "setting-conflict": 8, "weak-payoff": 7, "chapter-goal-drift": 7 },
    openingTenFocus: ["系统边界", "现实困境", "第一项任务代价", "奖励如何落地", "现实机构反应"],
    promptHints: ["重点检查系统机制是否服务现实欲望线。", "修订时让系统奖励带来 tradeoff，而不是替代主角行动。"]
  },
  {
    id: "historical",
    name: "历史",
    aliases: ["历史", "historical", "history"],
    protagonistEngine: ["在时代约束内制造制度/军事/商业分歧", "用知识、判断和联盟承担后果"],
    payoffPatterns: ["小改革见效", "后勤/政策/战术解决具体危机", " faction balance shift"],
    rhythm: ["每段推进物资、法令、派系、地理、信息延迟或治理后果", "胜利后要出现行政负担"],
    progression: ["创新受材料、工匠、资金、保护和既得利益限制", "派系从地方到朝堂/军队/商路扩展"],
    readerPitfalls: ["现代知识立刻成功", "官员没有利益", "战争忽略后勤天气和指挥"],
    endingHooks: ["改革威胁具体利益集团", "军需出问题", "诏令/奏章到达", "盟友开价", "胜利带来治理负担"],
    auditWeights: { "setting-conflict": 10, "information-overreach": 8, "role-ooc": 8, "weak-payoff": 6 },
    openingTenFocus: ["时代约束", "第一项小改革", "材料/人手/钱粮限制", "派系利益", "行政后果"],
    promptHints: ["重点检查法度、粮草、交通、阶层、官职和利益链。", "修订时用时代物件和制度摩擦替代现代口吻。"]
  },
  {
    id: "sci-fi",
    name: "科幻",
    aliases: ["科幻", "sci-fi", "scifi", "science-fiction"],
    protagonistEngine: ["一个清晰 speculative rule 推动生存/社会/战争/文明变化", "实验和约束驱动情节"],
    payoffPatterns: ["规则测试", "数据矛盾", "技术可用但有副作用", "尺度扩张伴随人类代价"],
    rhythm: ["实验/失败模式/技术或社会约束/尺度扩展循环", "说明必须服务决策"],
    progression: ["核心技术定义能做/不能做/成本/失败模式", "从个体问题扩展到机构、城市、星球或文明"],
    readerPitfalls: ["科技像魔法", "宏大形容词没有操作意义", "尺度太早变大而人物未建立"],
    endingHooks: ["数据反驳模型", "技术产生不可接受副作用", "更大尺度信号到达", "资源分配迫使选择"],
    auditWeights: { "setting-conflict": 9, "information-overreach": 9, "weak-payoff": 7, "summary-like-prose": 6 },
    openingTenFocus: ["核心规则", "第一次实验", "失败模式", "资源限制", "人的代价"],
    promptHints: ["重点检查技术规则一致性、失败模式和成本。", "修订时用数据、仪器、协议和具体选择承载科幻感。"]
  },
  {
    id: "game-system",
    name: "游戏/系统",
    aliases: ["游戏/系统", "游戏", "系统", "game-system", "system", "game"],
    protagonistEngine: ["任务循环、build 优化、奖励预期和机制战术", "数值服务场景选择"],
    payoffPatterns: ["隐藏条件触发", "build 选择兑现", "副本机制破解", "排行榜/公会反应"],
    rhythm: ["任务目标、机制选择、战术使用、奖励预期、冷却/代价、社会反应循环"],
    progression: ["奖励解锁新战术和新弱点", "系统规则从个人任务扩展到副本、排行榜和玩家社会"],
    readerPitfalls: ["数字没有战术意义", "系统任意发奖励", "任务替代主角欲望"],
    endingHooks: ["隐藏条件出现", "奖励预览改变优先级", "build 选择锁定路径", "同规则被他人利用"],
    auditWeights: { "chapter-goal-drift": 8, "weak-payoff": 8, "information-overreach": 7, "setting-conflict": 7 },
    openingTenFocus: ["任务目标", "机制边界", "build 身份", "第一项奖励预期", "系统代价"],
    promptHints: ["重点检查数字是否改变战术。", "修订时让面板短而有用，让奖励制造取舍。"]
  },
  {
    id: "supernatural-mystery",
    name: "悬疑灵异",
    aliases: ["悬疑灵异", "悬疑", "灵异", "诡秘", "supernatural-mystery", "mystery", "weird"],
    protagonistEngine: ["未知规则、调查压力、知识代价和逐步掌握", "线索-假设-测试-代价-修正规则"],
    payoffPatterns: ["线索公平但不完整", "假规则被推翻", "恐惧变成具体规则", "知识/能力留下污染或债"],
    rhythm: ["每 3-5 章出现新线索、假设测试、误解暴露、规则代价或组织注意", "惊吓必须有可推理模式"],
    progression: ["案件到组织到隐藏历史或秩序", "能力获得伴随污染、记忆、标记或社会暴露"],
    readerPitfalls: ["作者强行隐瞒谜底", "怪事随机发生", "主角靠运气活下来"],
    endingHooks: ["物证矛盾", "危险触发规则显形", "假设错了但有价值", "使用知识后付出代价"],
    auditWeights: { "information-overreach": 10, "hook-omission": 9, "weak-ending-hook": 8, "setting-conflict": 8 },
    openingTenFocus: ["第一条异常规则", "公平线索", "错误假设", "知识代价", "组织/更大规则影子"],
    promptHints: ["重点检查信息遮蔽、误导公平性、线索链和规则代价。", "修订时让恐惧来自具体规则，而不是泛泛氛围。"]
  }
] satisfies Omit<GenreCard, "generic">[];

const genericCard: GenreCard = GenreCardSchema.parse({
  id: "generic",
  name: "通用",
  aliases: ["generic", "通用"],
  generic: true,
  protagonistEngine: ["清晰欲望", "稳定阻力", "可见变化"],
  payoffPatterns: ["目标推进", "冲突升级", "信息增量", "结尾钩子"],
  rhythm: ["每章应有目标、阻力、转折和可见变化"],
  progression: ["从局部目标扩展到更大冲突"],
  readerPitfalls: ["目标模糊", "解释多于行动", "钩子空泛"],
  endingHooks: ["新问题", "新代价", "新选择"],
  auditWeights: { "chapter-goal-drift": 7, "weak-payoff": 7, "weak-ending-hook": 7 },
  openingTenFocus: ["主角欲望", "核心冲突", "读者承诺", "章节钩子"],
  promptHints: ["按通用商业网文节奏检查目标、冲突、爽点和钩子。"]
});

export const genreCards = cards.map((card) => GenreCardSchema.parse({ ...card, generic: false }));

export function listGenreCards(): GenreCard[] {
  return [...genreCards];
}

export function resolveGenreCard(genre: string): GenreCard {
  const normalized = normalizeGenre(genre);
  return (
    genreCards.find(
      (card) => normalizeGenre(card.id) === normalized || card.aliases.some((alias) => normalizeGenre(alias) === normalized)
    ) ?? genericCard
  );
}

export function renderGenrePromptHints(card: GenreCard): string {
  return `类型卡：${card.name} (${card.id})
- 主角引擎：${card.protagonistEngine.join("；")}
- 爽点模式：${card.payoffPatterns.join("；")}
- 常见节奏：${card.rhythm.join("；")}
- 升级/扩展体系：${card.progression.join("；")}
- 读者雷点：${card.readerPitfalls.join("；")}
- 章尾钩子：${card.endingHooks.join("；")}
- 审计权重：${Object.entries(card.auditWeights)
    .map(([key, value]) => `${key}=${value}`)
    .join("；")}
- 开篇 10 章重点：${card.openingTenFocus.join("；")}
- Prompt hints：${card.promptHints.join("；")}`;
}

function normalizeGenre(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}
