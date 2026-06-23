const { ROUTES } = require("../../core/routes.js");
const { getBootstrap } = require("../../services/bootstrap-service.js");
const {
  adoptChildGrowthPartner,
  getChildGrowthPartner,
  listGrowthPartnerTemplates,
} = require("../../services/growth-partner-service.js");
const { normalizeAssetPath } = require("../../utils/asset-path.js");
const { defaultFeedbackState, showInlineFeedback } = require("../../utils/inline-feedback.js");
const { buildNavState, goBackWithFallback } = require("../../utils/navigation-bar.js");

Page({
  data: {
    loading: true,
    errorText: "",
    childId: "",
    childNickname: "",
    templates: [],
    showPartnerSelector: false,
    selectedTemplateCode: "",
    selectedTemplateName: "",
    selectedTemplateDescription: "",
    selectedPreviewImageUrl: "",
    selectedPreviewName: "",
    selectedPreviewRequiredText: "",
    selectedStageShowcaseClass: "stage-showcase",
    selectedStages: [],
    adoptedTemplateCode: "",
    adoptButtonText: "领取雷纹战虎",
    adoptActionClass: "adopt-action action-disabled",
    adopting: false,
    icons: {
      arrowBack: "\ue5e0",
      checkCircle: "\ue86c",
      localFire: "\uea3e",
    },
    ...defaultFeedbackState,
    ...buildNavState({ title: "选择成长伙伴", showBack: true }),
  },

  async onLoad() {
    await this.loadGrowthPartners();
  },

  async loadGrowthPartners() {
    this.setData({
      loading: true,
      errorText: "",
      childId: "",
      childNickname: "",
      templates: [],
      showPartnerSelector: false,
      selectedTemplateCode: "",
      selectedTemplateName: "",
      selectedTemplateDescription: "",
      selectedPreviewImageUrl: "",
      selectedPreviewName: "",
      selectedPreviewRequiredText: "",
      selectedStageShowcaseClass: "stage-showcase",
      selectedStages: [],
      adoptedTemplateCode: "",
      adoptButtonText: "领取雷纹战虎",
      adoptActionClass: "adopt-action action-disabled",
      adopting: false,
      ...defaultFeedbackState,
    });
    try {
      const bootstrap = await getBootstrap();
      if (bootstrap.needOnboarding || !bootstrap.defaultChild) {
        wx.redirectTo({ url: ROUTES.START });
        return;
      }

      const childId = bootstrap.defaultChild.id;
      const [templates, partnerState] = await Promise.all([
        listGrowthPartnerTemplates(),
        getChildGrowthPartner(childId),
      ]);
      const normalizedTemplates = (templates || []).map((template) => toTemplateCard(template, partnerState));
      const selectedTemplate = normalizedTemplates[0] || null;
      const adoptedTemplateCode = partnerState && partnerState.adopted && partnerState.partner
        ? partnerState.partner.templateCode
        : "";
      this.setData({
        childId,
        childNickname: bootstrap.defaultChild.nickname,
        templates: normalizedTemplates.map((template) => withSelectedState(template, selectedTemplate)),
        showPartnerSelector: normalizedTemplates.length > 1,
        adoptedTemplateCode,
        ...buildSelectedState(selectedTemplate, adoptedTemplateCode, false),
      });
    } catch (error) {
      this.setData({ errorText: error.message || "成长伙伴加载失败" });
    } finally {
      this.setData({ loading: false });
    }
  },

  selectTemplate(event) {
    const templateCode = event.currentTarget.dataset.templateCode;
    const selectedTemplate = this.data.templates.find((item) => item.templateCode === templateCode);
    if (!selectedTemplate) {
      return;
    }
    this.setData({
      templates: this.data.templates.map((template) => withSelectedState(template, selectedTemplate)),
      ...buildSelectedState(selectedTemplate, this.data.adoptedTemplateCode, this.data.adopting),
    });
  },

  previewStage(event) {
    const stageCode = event.currentTarget.dataset.stageCode;
    const selectedTemplate = this.data.templates.find((item) => item.templateCode === this.data.selectedTemplateCode);
    if (!selectedTemplate || !stageCode) {
      return;
    }
    this.setData({ selectedStageShowcaseClass: "stage-showcase" });
    setTimeout(() => {
      this.setData(buildSelectedState(
        selectedTemplate,
        this.data.adoptedTemplateCode,
        this.data.adopting,
        stageCode,
        true,
      ));
    }, 20);
  },

  async adoptTap() {
    if (!this.data.childId || !this.data.selectedTemplateCode || this.data.adopting) {
      return;
    }
    if (this.data.adoptedTemplateCode) {
      showInlineFeedback(this, "已经领取成长伙伴", "info");
      return;
    }
    try {
      this.setData({
        adopting: true,
        adoptActionClass: "adopt-action action-disabled",
      });
      const partnerState = await adoptChildGrowthPartner(this.data.childId, this.data.selectedTemplateCode);
      const adoptedTemplateCode = partnerState && partnerState.partner
        ? partnerState.partner.templateCode
        : this.data.selectedTemplateCode;
      const selectedTemplate = this.data.templates.find((item) => item.templateCode === adoptedTemplateCode)
        || this.data.templates[0];
      this.setData({
        adoptedTemplateCode,
        templates: this.data.templates.map((template) => withSelectedState(template, selectedTemplate)),
        ...buildSelectedState(selectedTemplate, adoptedTemplateCode, false),
      });
      showInlineFeedback(this, "成长伙伴已领取", "success");
    } catch (error) {
      showInlineFeedback(this, error.message || "领取失败", "error");
    } finally {
      this.setData({
        adopting: false,
        ...buildSelectedState(
          this.data.templates.find((item) => item.templateCode === this.data.selectedTemplateCode),
          this.data.adoptedTemplateCode,
          false,
        ),
      });
    }
  },

  goBack() {
    goBackWithFallback(ROUTES.TODAY, true);
  },
});

function toTemplateCard(template, partnerState) {
  const adopted = partnerState && partnerState.adopted && partnerState.partner
    && partnerState.partner.templateCode === template.templateCode;
  const currentStages = adopted && Array.isArray(partnerState.stages)
    ? partnerState.stages
    : template.stages;
  return {
    ...template,
    selectedClass: "partner-option",
    adopted,
    adoptedBadgeText: adopted ? "已领取" : "",
    showAdoptedBadge: adopted,
    stages: (currentStages || []).map(toStageCard),
  };
}

function toStageCard(stage) {
  return {
    ...stage,
    imageUrl: normalizeAssetPath(stage.previewImageUrl || stage.imageUrl),
    requiredText: `${stage.requiredGrowthPoints || 0} 成长分`,
    baseStageClass: "stage-preview",
    stageClass: "stage-preview",
    stateText: "预览",
  };
}

function withSelectedState(template, selectedTemplate) {
  const selected = selectedTemplate && template.templateCode === selectedTemplate.templateCode;
  return {
    ...template,
    selectedClass: selected ? "partner-option partner-option-selected" : "partner-option",
  };
}

function buildSelectedState(selectedTemplate, adoptedTemplateCode, adopting, previewStageCode = "", animatePreview = false) {
  if (!selectedTemplate) {
    return {
      selectedTemplateCode: "",
      selectedTemplateName: "",
      selectedTemplateDescription: "",
      selectedPreviewImageUrl: "",
      selectedPreviewName: "",
      selectedPreviewRequiredText: "",
      selectedStageShowcaseClass: "stage-showcase",
      selectedStages: [],
      adoptButtonText: "暂无可领取伙伴",
      adoptActionClass: "adopt-action action-disabled",
    };
  }
  const adopted = Boolean(adoptedTemplateCode);
  const stages = selectedTemplate.stages || [];
  const previewStage = stages.find((stage) => stage.stageCode === previewStageCode) || stages[0] || null;
  const previewImageUrl = previewStage ? previewStage.imageUrl : "";
  return {
    selectedTemplateCode: selectedTemplate.templateCode,
    selectedTemplateName: selectedTemplate.name,
    selectedTemplateDescription: selectedTemplate.description,
    selectedPreviewImageUrl: previewImageUrl,
    selectedPreviewName: previewStage ? previewStage.name : "",
    selectedPreviewRequiredText: previewStage ? previewStage.requiredText : "",
    selectedStageShowcaseClass: animatePreview ? "stage-showcase stage-showcase-pop" : "stage-showcase",
    selectedStages: stages.map((stage) => withStagePreviewState(stage, previewStage)),
    adoptButtonText: adopted ? `已领取${selectedTemplate.name}` : adopting ? "领取中" : `领取${selectedTemplate.name}`,
    adoptActionClass: adopted || adopting ? "adopt-action action-disabled" : "adopt-action",
  };
}

function withStagePreviewState(stage, previewStage) {
  const selected = previewStage && stage.stageCode === previewStage.stageCode;
  return {
    ...stage,
    selected,
    stageClass: selected ? `${stage.baseStageClass} stage-preview-selected` : stage.baseStageClass,
  };
}
