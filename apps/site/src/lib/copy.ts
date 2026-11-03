export const copy = (locale:string) => locale.startsWith('zh') ? {
  home:'首页',about:'关于',contact:'联系',articles:'文章',products:'产品',
  explore:'了解更多',talk:'告诉我们你的需求',empty:'内容即将更新。',
  aboutText:'在这里介绍你的团队、服务与工作方式。请在上线前替换为真实资料。',
  name:'姓名',email:'邮箱',company:'公司（选填）',message:'需求说明',send:'发送询盘',
  sending:'正在发送…',saved:'询盘已收到，编号：',queued:'询盘已安全接收，等待同步，编号：',failed:'暂时未发送成功，内容已保留，请稍后重试。',
  privacy:'提交的信息用于接收、核对和回应此次咨询。请勿提交密码或其他机密信息，详见本站隐私说明。',
  template:'独立站模板',details:'详情',specs:'规格',
} : {
  home:'Home',about:'About',contact:'Contact',articles:'Journal',products:'Products',
  explore:'Explore the journal',talk:'Tell us what you have in mind',empty:'New content is on its way.',
  aboutText:'Introduce your team, services and approach here. Replace this sample introduction with verified business information before launch.',
  name:'Name',email:'Email',company:'Company (optional)',message:'How can we help?',send:'Send inquiry',
  sending:'Sending…',saved:'Inquiry received. Reference: ',queued:'Inquiry safely received and awaiting sync. Reference: ',failed:'We could not send this yet. Your draft is saved; please try again.',
  privacy:'Your details are used to respond to this inquiry. Add your applicable privacy information before launch.',
  template:'Independent site',details:'View details',specs:'Specifications',
}
