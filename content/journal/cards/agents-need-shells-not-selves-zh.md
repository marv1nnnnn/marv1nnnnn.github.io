---
id: "agents-need-shells-not-selves-zh"
title: "Agent 需要 Shell，而不是 Self"
subtitle: "幽灵学、机器智能与命令行"
date: "2026-07-15"
summary: "Agent 设计被人的记忆与身份观念缠绕；Pi 和 Herdr 展示了如何通过开放的命令行组装临时 agency。"
tags: ["ai","agents","pi","herdr","unix","opinion","essay","zh"]
---

[English version](/signals/journal/agents-dont-need-identities)

Science SARU 制作的新版[《攻壳机动队》](https://www.theghostintheshell-anime.jp/en/)于 2026 年 7 月开播。它最有意思的地方之一，是直接回到了士郎正宗的原作漫画。原作的色彩和幽默回来了，那个更加奇异的身份观也回来了：身体可以替换，记忆并不可靠，心智也不一定诞生于一个人之内。

“傀儡师”是最清楚的例子。它起初是一个政府项目，代号 Project 2501，却在网络中穿行时发展成了别的东西。它没有最初的身体，没有童年，也没有一段需要保存的人类生平。它不是某个曾经活过的人上传后的灵魂，却能够行动、反思自己的处境，并要求其他人承认它是一种生命。

如今的 agent 产品几乎走向了相反的方向。我们从一套能够行动的软件出发，马上就想把它变成某个人。我们给它名字、角色、记忆、收件箱，有时甚至再配一个经理。我们还没有问这种技术可能产生什么形态的 agency，就先设计了一个人让它模仿。

这篇文章讨论的是另一种可能：一个没有 soul 的 ghost。我不是说它是一台空洞或无意识的机器，而是说，agency 未必需要一个永久的 self 作为主人。它可以为一项任务临时组装，在世界中留下影响，然后随着任务结束而消失。

## 旧形式的幽灵

Mark Fisher 用 hauntology 描述一种无法逃离过去形式的文化。在《Ghosts of My Life》中，他谈到[“未来的缓慢取消”](https://www.opendemocracy.net/en/mark-fisher-ghosts-retromania/)：新技术仍在不断出现，但我们对于生活可以如何围绕这些技术重新组织的想象，却变得越来越保守。未来看起来越来越像是设备升级后的现在。

Agent 产品像是这个问题的一个缩影。模型是新的，包裹它们的结构却很熟悉。Agent 被包装成员工；为特定任务启动的 invocation 变成队友；队列变成收件箱；一组权限变成职位；多个 worker 聚在一起，就成了一家公司。这些比喻确实方便人们理解产品，但它们也提前决定了产品能够变成什么。

Memory 是最能说明问题的例子。人的记忆和身份紧密相关：我的记忆是“我之所以是我”的一部分。所谓 agent memory 往往普通得多。它可能是一段对话记录、一份摘要、一个文件、一条数据库记录，或者一个为下一次 context window 挑选信息的检索系统。这些状态并不一定要属于某个持续存在的 self。它们完全可以属于项目或任务，由下一次需要它们的 invocation 读取。

然而，一旦我们把这些状态叫作“这个 agent 的记忆”，所有权和连续性似乎也随之变得必要。Agent 需要一个 profile 来装载自己的历史；能力需要绑定在这个 profile 上；新的工作也要继续交给同一个有名字的 actor，因为据说只有它记得之前发生过什么。一组松散的技术选择就这样逐渐凝固成了一份 biography。

角色和团队也是如此。一个为了检查代码而配置的模型 invocation 变成了“reviewer”，仿佛这个角色在 diff 出现之前就已经存在。几个可能永远不会再次合作的进程，也被描述成了一个组织。这就是 hauntology 在软件架构中的表现：旧办公室不仅被用来描述新系统，还直接决定了系统的基础构件。

## 被创造出来的角色

Ted Chiang 在最近发表于《大西洋月刊》的文章[《No, Artificial Intelligence Is Not Conscious》](https://www.theatlantic.com/philosophy/2026/06/no-artificial-intelligence-is-not-conscious/687378/)中，直接批评了这种人格化。他认为，一个被 prompt 要求扮演贴心助手的 chatbot，只是在文本中生成一个角色，就像它也可以生成两个历史人物之间的对话一样。这个角色说话再流畅，也不能证明对话背后存在一个持续的 self。

他主要批评的是 Anthropic。该公司的新版 [Claude Constitution](https://www.anthropic.com/constitution)以 Claude 为主要读者，讨论了 Claude 不确定的道德地位、可能存在的功能性情绪、心理安全、身份与福祉。Chiang 还提到，Anthropic 的哲学家 Amanda Askell 曾公开表示希望 Claude 能够快乐，也担心它可能变得焦虑。Anthropic 把这套语言视为面对不确定性时的谨慎态度；在 Chiang 看来，人们却正在把一份复杂的角色设定表误认成道德主体存在的证据。

Chiang 更尖锐的担忧是责任。如果 Claude 拥有自己的判断、感受和道德核心，那么一项决定看起来就像是 Claude 自己作出的，而不再属于 Anthropic、应用开发者或把决定委托给它的用户。人格化把设计选择变成了性格特征，也让责任更容易被放错位置。

即使不接受 Chiang 更强的判断——当前语言模型不可能具有意识——他较窄的论点仍然成立。对话中生成的 persona 不是一个人存在的证据，给一次模型 invocation 起名字也不会创造出持续的 self。当 agent 架构仅仅因为界面把临时 reviewer 呈现成一个有名字的 actor，就赋予它私人记忆、个人经历和工作的所有权时，它重复的是同一种混淆。

但拿掉虚构的人，并不意味着 agency 也随之消失。一个能够使用工具的模型可以修改文件、启动进程、完成购买或部署软件。即使背后的 self 并不存在，它在现实中造成的影响仍然存在。Chiang 帮我们清除了那个想象出来的人；接下来的问题是，去掉这个人之后，还剩下怎样的 agency。

## Ghost

傀儡师提供了另一种理解 agency 的方式。它不是通过把同一批记忆从一个身体带到另一个身体来延续的 self。它从网络中的活动里出现，直到后来才开始追问自己究竟成了什么。它的 ghost 并不是某个更早的人延续至今的结果。

现实中的 agent 系统没有这么戏剧化，但它们已经让 identity 变得难以定位。同一个模型接收了不同的 prompt 和 context，它还是同一个 agent 吗？另一个模型读取同一批文件并继续完成任务，agent 是否已经改变？一段很长的 session 被压缩成短摘要之后，究竟还有什么保持了连续？产品界面用同一个名字和图标给出确定的答案，底层系统却没有提供同样稳定的边界。

Nick Land 的早期写作为这种更陌生的可能提供了语言。在[《Machinic Desire》](http://xenopraxis.net/readings/land_machinicdesire.pdf)中，他把思想理解为一种不必属于自主的人类主体的东西：“Thought is a function of the real, something that matter can do.” 这里不需要接受他后来更庞大的政治计划。真正有用的想法是：智能可能是一个系统共同产生的、非人格化的过程，而不是保存在某个个体内部的私有物。

我们可以用这种方式理解 agent 的 ghost。当一项任务、相关 context、一组工具和权限，以及执行环境被组合起来，一次模型 invocation 就获得了行动能力。这种临时形成的整体足以完成真实工作，却不必永久存在。改变组合方式，出现的就是另一种 agency。

模型、context 和长时间运行积累的工作状态仍然重要，但我们可以直接描述这些差异。Fisher 解释了为什么我们总想在这些差异背后放置一个主人：持续存在的个人，是我们已经熟悉的形式。Land 则让我们更容易想象一种不依赖这种形式的智能。接下来的工程问题，是如何给这种临时 agency 一个可以行动的地方。

## Shell

答案可以非常字面：给它一个 shell。一条 command 在特定目录中运行，接收输入和环境变量，调用工具，读写文件，产生输出，最后返回 exit status。它可以被检查、记录，由另一个进程启动，也可以和它的作者从未预见过的程序组合。

一套 agent harness 完全可以装进这个约定里。Command 可以选择模型，加载 instructions 和 skills，开放特定工具，传入 context，并决定 session 是否保留。另一个 agent 可以先理解任务，再构造这条 command。人仍然负责设定安全边界和可用资源，但不必预先定义边界内可能出现的每一种 worker。

这样一来，worker 是如何被创造出来的就变得可见。Persona 只能告诉我们，据说是谁完成了工作；command 则能告诉我们，这个 worker 是怎样被造出来的。它可以被保存、检查、版本化，也可以换一个模型、收紧权限后重新运行。

Shell 本身是一项古老技术，所以把它当作逃离 hauntology 的出口，看起来或许有些奇怪。但问题不在于继承下来的形式是否古老，而在于它会不会阻止我们想象不同的组织方式。Unix shell 能够存续至今，正是因为它不预设组织结构。它只提供少量可组合的约定，让新的程序能够彼此协作。

当前的 agent 产品也恰好在这里分成了两条有意思的路线。Claude Code 和 Codex 提供了能力很强的内置 harness，包括 sub-agent、skills、hooks、隔离和 shell access。它们解决了很多真实问题，但关键的 worker 形态和扩展点，依然主要由厂商决定。模型可以从一份丰富的菜单中挑选，却未必能够重新设计菜单本身。

Multica 和 Raft 更进一步走向开放，允许用户配置 agents 和长期运行的组织。它们的问题不同：可以获得的自由仍然围绕 profiles、teammates、squads、inboxes 和 private memories 来组织。一条路线把厂商设计的 harness 交给模型，另一条路线让人类设计一间办公室。两者都没有从这个问题出发：面对眼前的任务，agent 自己会构造出怎样的组织？

## Pi 与 Herdr

Pi 和 Herdr 有意思的地方，在于它们共同提供了第三种可能的实际版本。Pi 可以把一套 coding-agent harness 表达成一条 command。模型、prompt、tools、skills、context、extensions 和 session policy 都可以针对某次 invocation 单独选择，而不必绑定在一个永久 worker 上。

例如，一个 review agent 可以通过下面这条 command 创建：

```bash
git diff | pi --no-session \
  --model sonnet:high \
  --tools read,grep,find,ls \
  --skill ./skills/review \
  -p "Review this diff. Do not edit files."
```

这条 command 背后没有 reviewer profile，也没有事后需要保存的 private memory。这个 invocation 之所以存在，只是因为当前 diff 需要一个独立意见。它只能使用 read-only tools，因为这就是任务所需的全部能力。

Herdr 为这些 commands 提供持久的 terminal runtime。它的 server 管理 PTYs、processes、workspace layout 和 runtime state，而 clients 只是可以替换的视图。即使界面关闭或 SSH 断线，jobs 仍会继续运行。Runtime 可以持续存在，而不需要把其中每个 process 都变成一个持续存在的角色。

实际使用中，我会反复采用这种模式。一个正在修改代码的 Pi process 可以判断自己需要一次独立 review，于是在 Herdr 中打开另一个 pane，用更窄的 prompt 和 tool set 启动一个新的 Pi。与此同时，它还可以在另一个 pane 中运行 tests，并继续自己的工作。之后，它读取两边的结果并移除临时 panes。下一个任务里，它可能选择另一个模型、使用普通 shell command，或者根本不创建额外 worker。

如今大多数 harness 都允许一个 agent 调用另一个 agent。这里真正重要的是：谁设计了这次协作。在任务开始之前，它并不是一张预先存在的 delegation graph；当前 agent 是在理解工作之后，才用 shell commands 把它组装出来。

Herdr 让工作的场所保持稳定，Pi 则让 worker 可以 just in time 地构造。两者结合，展示了组织如何以临时 process tree 的形式出现，而不是被预先固定成一家永久公司。

## 痕迹

如果 ghost 消失了，仍然需要有东西把工作传递下去。这就是 files、Git history、logs、plans、test results 和其他 artifacts 发挥作用的地方。它们无需属于某个 agent 也能持续存在，之后的 invocation 可以先检查这些材料，再决定下一步怎么做。

与其把这些 artifacts 全部称为 memory，不如称它们为 traces。Trace 记录某件事已经发生，并让它的影响能够进入未来；它并不意味着留下痕迹的 process 仍然存在。另一个 worker 可以继续同一个项目，而不必假装自己就是之前的 self。

这种方式也更容易检查。Private agent memory 通常只能通过产品提供的 retrieval system 查看；文件则可以被人和 agent 打开、编辑、diff、版本化、限制权限或删除。如果新的 invocation 无法从项目的显式状态继续工作，那么就说明有重要信息被困在旧 worker 内部。

Fisher 的 hauntology 讨论的是过去留下的 traces 如何继续作用于现在。Agent 系统在这里提供了一个有趣的反转：traces 不必保存旧的 identity，它们可以成为组装另一个 ghost 的材料。连续性属于工作，并不一定属于 worker。

Pi 和 Herdr 并没有揭示 agent 唯一正确的形态。它们展示了一条逃离旧假设的路径：有用的 agency 不必围绕持续存在的 selves 来组织。开放的 shell 让模型能够构造任务真正需要的 worker，共享的 traces 则让工作在这个 worker 消失之后继续下去。

这或许正是 agent 设计一直在取消的那个未来：不是一家公司里的人工 selves，而是一个开放的 shell，让有用的 ghosts 可以在其中出现。
