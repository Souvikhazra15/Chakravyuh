const CATEGORY_WEIGHTS = {
	girls_toilet: 5.0,
	structural: 5.0,
	electrical: 4.5,
	classroom: 4.0,
	plumbing: 3.5,
	other: 2.0,
};

function normalizeText(value) {
	return String(value || "").toLowerCase().trim();
}

function normalizeCategory(category) {
	const c = normalizeText(category);
	if (c.includes("girl") || c.includes("toilet")) return "girls_toilet";
	if (c.includes("struct")) return "structural";
	if (c.includes("electric")) return "electrical";
	if (c.includes("class")) return "classroom";
	if (c.includes("plumb")) return "plumbing";
	return "other";
}

function toTitle(value) {
	return String(value || "")
		.replace(/_/g, " ")
		.split(" ")
		.filter(Boolean)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join(" ");
}

function safeNumber(value, fallback = 0) {
	const n = Number(value);
	return Number.isFinite(n) ? n : fallback;
}

function inferPriorityLevel(priorityScore) {
	if (priorityScore >= 3.5) return "Critical";
	if (priorityScore >= 2.5) return "High";
	if (priorityScore >= 1.5) return "Medium";
	return "Low";
}

function inferReason(item) {
	const risk = safeNumber(item.risk_score, 0);
	const category = normalizeCategory(item.category);
	const weight = CATEGORY_WEIGHTS[category] || CATEGORY_WEIGHTS.other;
	const existingReason = String(item.reason || "").trim();

	if (existingReason) {
		return existingReason;
	}

	const riskPart =
		risk >= 0.75
			? `high risk score (${risk.toFixed(2)})`
			: risk >= 0.5
			? `moderate risk score (${risk.toFixed(2)})`
			: `lower risk score (${risk.toFixed(2)})`;

	const categoryPart =
		category === "girls_toilet" || category === "structural"
			? "safety-critical category with high impact weight"
			: `category impact weight ${weight.toFixed(1)}`;

	return `${riskPart} and ${categoryPart}`;
}

function normalizeAnalysisRow(row) {
	const riskScore = safeNumber(row.risk_score, 0);
	const priorityScore =
		row.priority_score !== undefined && row.priority_score !== null
			? safeNumber(row.priority_score, 0)
			: riskScore * (CATEGORY_WEIGHTS[normalizeCategory(row.category)] || CATEGORY_WEIGHTS.other);

	const priorityLevel = row.priority_level || inferPriorityLevel(priorityScore);

	return {
		school_id: row.school_id,
		category: toTitle(row.category),
		risk_score: riskScore,
		days_to_failure: safeNumber(row.days_to_failure, 0),
		priority_score: Number(priorityScore.toFixed(2)),
		priority_level: priorityLevel,
		reason: inferReason({ ...row, risk_score: riskScore }),
	};
}

function normalizeWorkOrder(row) {
	return {
		school_id: row.school_id,
		category: toTitle(row.category),
		assigned_contractor: String(row.assigned_contractor || row.assigned_to || "").trim(),
		status: String(row.status || "").trim() || "Pending",
	};
}

function computeSummary(analysisData, summary) {
	if (summary && typeof summary === "object") {
		return {
			total_issues: safeNumber(summary.total_issues, analysisData.length),
			critical: safeNumber(summary.critical, 0),
			high: safeNumber(summary.high, 0),
			medium: safeNumber(summary.medium, 0),
			low: safeNumber(summary.low, 0),
		};
	}

	return {
		total_issues: analysisData.length,
		critical: analysisData.filter((d) => d.priority_level === "Critical").length,
		high: analysisData.filter((d) => d.priority_level === "High").length,
		medium: analysisData.filter((d) => d.priority_level === "Medium").length,
		low: analysisData.filter((d) => d.priority_level === "Low").length,
	};
}

function classifyQuery(query) {
	const q = normalizeText(query);

	if (
		q.includes("assigned") ||
		q.includes("contractor") ||
		q.includes("pending task") ||
		q.includes("my task")
	) {
		return "contractor";
	}

	if (
		q.includes("how many") ||
		q.includes("overview") ||
		q.includes("summary") ||
		q.includes("total issues")
	) {
		return "summary";
	}

	if (q.includes("why") || q.includes("explain")) {
		return "explanation";
	}

	if (
		q.includes("what should") ||
		q.includes("next action") ||
		q.includes("prioritize") ||
		q.includes("do next")
	) {
		return "action";
	}

	if (
		q.includes("critical") ||
		q.includes("top") ||
		q.includes("high-risk") ||
		q.includes("high risk") ||
		q.includes("most")
	) {
		return "priority";
	}

	return "unsupported";
}

function pickTopIssues(analysisData, query) {
	const q = normalizeText(query);
	let limit = 5;
	const nMatch = q.match(/top\s+(\d+)/);
	if (nMatch) {
		limit = Math.max(1, Math.min(20, Number(nMatch[1])));
	}

	let filtered = [...analysisData];
	if (q.includes("critical")) filtered = filtered.filter((d) => d.priority_level === "Critical");
	else if (q.includes("high")) filtered = filtered.filter((d) => ["Critical", "High"].includes(d.priority_level));

	filtered.sort((a, b) => b.priority_score - a.priority_score);
	return filtered.slice(0, limit);
}

function findTargetIssue(analysisData, query) {
	const q = normalizeText(query);

	const schoolToken = q.match(/school[_\s-]?(\d+)/i);
	if (schoolToken) {
		const schoolDigits = schoolToken[1];
		const found = analysisData.find((item) => String(item.school_id).includes(schoolDigits));
		if (found) return found;
	}

	const categories = ["girls", "toilet", "structural", "electrical", "classroom", "plumbing"];
	const categoryHit = categories.find((c) => q.includes(c));
	if (categoryHit) {
		const found = analysisData
			.filter((item) => normalizeText(item.category).includes(categoryHit))
			.sort((a, b) => b.priority_score - a.priority_score)[0];
		if (found) return found;
	}

	return analysisData.sort((a, b) => b.priority_score - a.priority_score)[0] || null;
}

function formatPriorityResponse(items) {
	if (!items.length) return "Data not available";
	return items
		.map(
			(item) =>
				`- ${item.school_id} | ${item.category} | ${item.priority_level} | Reason: ${item.reason}`
		)
		.join("\n");
}

function formatExplanationResponse(item) {
	if (!item) return "Data not available";
	return [
		`- School: ${item.school_id}`,
		`- Category: ${item.category}`,
		`- Risk Score: ${item.risk_score.toFixed(2)}`,
		`- Priority: ${item.priority_level}`,
		`- Reason: ${item.reason}`,
	].join("\n");
}

function formatSummaryResponse(summary) {
	if (!summary) return "Data not available";
	return [
		`- Total Issues: ${summary.total_issues}`,
		`- Critical: ${summary.critical}`,
		`- High: ${summary.high}`,
		`- Medium: ${summary.medium}`,
		`- Low: ${summary.low}`,
	].join("\n");
}

function formatActionResponse(items) {
	if (!items.length) return "Data not available";

	const actionable = items.slice(0, 3).map((item) => {
		const due = item.days_to_failure > 0 ? `${item.days_to_failure} days` : "immediate";
		const action =
			item.priority_level === "Critical"
				? "Assign contractor immediately"
				: item.priority_level === "High"
				? "Schedule within 7 days"
				: "Plan in regular maintenance cycle";

		return `- ${item.school_id} | ${item.category} | ${item.priority_level} | ${due} | Action: ${action}`;
	});

	return actionable.join("\n");
}

function formatContractorResponse(workOrders, query) {
	if (!workOrders.length) return "Data not available";
	const q = normalizeText(query);

	let filtered = workOrders;
	if (q.includes("pending")) {
		filtered = workOrders.filter((w) => normalizeText(w.status) === "pending");
	} else if (q.includes("in progress")) {
		filtered = workOrders.filter((w) => normalizeText(w.status) === "in progress");
	} else if (q.includes("completed")) {
		filtered = workOrders.filter((w) => normalizeText(w.status) === "completed");
	}

	if (!filtered.length) return "Data not available";

	return filtered
		.map(
			(w) =>
				`- ${w.school_id || "Unknown School"} | ${w.category || "Unknown Category"} | Contractor: ${w.assigned_contractor || "Unassigned"} | Status: ${w.status}`
		)
		.join("\n");
}

export function answerDecisionQuery({ query, analysisData = [], summary = null, workOrders = [] }) {
	const normalizedAnalysis = Array.isArray(analysisData)
		? analysisData.map(normalizeAnalysisRow)
		: [];
	const normalizedWorkOrders = Array.isArray(workOrders)
		? workOrders.map(normalizeWorkOrder)
		: [];
	const resolvedSummary = computeSummary(normalizedAnalysis, summary);
	const queryType = classifyQuery(query);

	if (queryType === "priority") {
		return formatPriorityResponse(pickTopIssues(normalizedAnalysis, query));
	}

	if (queryType === "explanation") {
		return formatExplanationResponse(findTargetIssue(normalizedAnalysis, query));
	}

	if (queryType === "summary") {
		return formatSummaryResponse(resolvedSummary);
	}

	if (queryType === "action") {
		const top = [...normalizedAnalysis].sort((a, b) => b.priority_score - a.priority_score);
		return formatActionResponse(top);
	}

	if (queryType === "contractor") {
		return formatContractorResponse(normalizedWorkOrders, query);
	}

	return "Data not available";
}

export function buildAssistantRules() {
	return {
		role: "Decision-support assistant for Principal, DEO, Contractor",
		scope: [
			"priority questions",
			"explanation questions",
			"summary questions",
			"action suggestions",
			"contractor questions",
		],
		rules: [
			"Use only provided structured data",
			"Do not hallucinate",
			"If data is missing, return: Data not available",
			"Keep responses short and actionable",
		],
	};
}
 