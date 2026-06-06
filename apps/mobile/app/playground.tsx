import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSalesTheme } from "../hooks/use-theme";
import { PipelineStep } from "../components/pipeline-step";
import { EmptyState } from "../components/empty-state";
import { findAnswer, FALLBACK_ANSWER, SUGGESTED_QUESTIONS } from "../data/mock-playground";

type Step = "idle" | "embedding" | "searching" | "ranking" | "sources" | "generating" | "done";

const STEP_ORDER: Step[] = ["embedding", "searching", "ranking", "sources", "generating", "done"];

const STEP_LABELS: Record<Exclude<Step, "idle">, { label: string; desc: string }> = {
  embedding: { label: "Embedding query", desc: "OpenAI text-embedding-3-small" },
  searching: { label: "Searching pgvector", desc: "Cosine similarity across 1,382 chunks" },
  ranking: { label: "Ranking results", desc: "Sorting by relevance score" },
  sources: { label: "Retrieved sources", desc: "Top 2 matches found" },
  generating: { label: "Generating answer", desc: "DeepSeek with source context" },
  done: { label: "Complete", desc: "Answer ready" },
};

export default function PlaygroundScreen() {
  const theme = useSalesTheme();
  const [question, setQuestion] = useState("");
  const [currentStep, setCurrentStep] = useState<Step>("idle");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<Array<{ documentName: string; chunkIndex: number; score: number; excerpt: string }>>([]);
  const stepIndexRef = useRef(0);

  const isRunning = currentStep !== "idle" && currentStep !== "done";

  function handleAsk() {
    const q = question.trim();
    if (!q) return;

    // Reset
    stepIndexRef.current = 0;
    setCurrentStep("embedding");
    setAnswer(null);
    setSources([]);
  }

  // Step animation
  useEffect(() => {
    if (currentStep === "idle" || currentStep === "done") return;

    const delays: Partial<Record<Step, number>> = {
      embedding: 900,
      searching: 900,
      ranking: 700,
      sources: 1200,
      generating: 1000,
    };

    const delay = delays[currentStep] ?? 800;

    const timer = setTimeout(() => {
      const idx = STEP_ORDER.indexOf(currentStep);
      const next = STEP_ORDER[idx + 1] as Step;

      if (currentStep === "sources") {
        // Populate sources
        const result = findAnswer(question) || FALLBACK_ANSWER;
        if (result.sources.length > 0) {
          setSources(result.sources);
        }
      }

      if (currentStep === "generating") {
        const result = findAnswer(question) || FALLBACK_ANSWER;
        setAnswer(result.answer);
      }

      if (next) {
        setCurrentStep(next);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [currentStep, question]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: theme.textColor }]}>AI Playground</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>RAG Pipeline</Text>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.cardBg, color: theme.textColor, borderColor: theme.borderColor }]}
            placeholder="Ask a question about your documents..."
            placeholderTextColor={theme.muted}
            value={question}
            onChangeText={setQuestion}
            multiline
            numberOfLines={3}
            editable={!isRunning}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: "#265834", opacity: isRunning ? 0.5 : 1 }]}
            onPress={handleAsk}
            disabled={isRunning || !question.trim()}
          >
            {isRunning ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Suggested questions (only when idle) */}
        {currentStep === "idle" && (
          <View style={styles.suggestions}>
            {SUGGESTED_QUESTIONS.map((q) => (
              <TouchableOpacity
                key={q}
                style={[styles.suggestionPill, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}
                onPress={() => {
                  setQuestion(q);
                  stepIndexRef.current = 0;
                  setCurrentStep("embedding");
                  setAnswer(null);
                  setSources([]);
                }}
              >
                <Text style={[styles.suggestionText, { color: theme.secondaryText }]}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Pipeline steps */}
        {currentStep !== "idle" && (
          <View style={[styles.pipelineCard, { backgroundColor: theme.cardBg }, theme.shadowStyle]}>
            <Text style={[styles.pipelineTitle, { color: theme.secondaryText }]}>PIPELINE</Text>
            {(["embedding", "searching", "ranking", "sources", "generating"] as Step[]).map((step) => {
              const stepIdx = STEP_ORDER.indexOf(step);
              const currentIdx = STEP_ORDER.indexOf(currentStep as Step);
              const isDone = currentIdx > stepIdx;
              const isActive = currentStep === step;
              return (
                <PipelineStep
                  key={step}
                  step={stepIdx + 1}
                  label={STEP_LABELS[step].label}
                  description={STEP_LABELS[step].desc}
                  isActive={isActive}
                  isDone={isDone}
                />
              );
            })}
          </View>
        )}

        {/* Retrieved sources */}
        {sources.length > 0 && (currentStep === "sources" || currentStep === "generating" || currentStep === "done") && (
          <View style={[styles.sourcesCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }, theme.shadowStyle]}>
            <View style={styles.sourcesHeader}>
              <Ionicons name="link" size={13} color={theme.isDark ? "#579360" : "#265834"} />
              <Text style={[styles.sourcesTitle, { color: theme.isDark ? "#579360" : "#265834" }]}>
                RETRIEVED SOURCES
              </Text>
            </View>
            {sources.map((src, idx) => (
              <View key={idx} style={[styles.source, idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.borderColor }]}>
                <View style={styles.sourceTop}>
                  <View style={[styles.sourceNum, { backgroundColor: theme.iconBg }]}>
                    <Text style={[styles.sourceNumText, { color: theme.isDark ? "#579360" : "#265834" }]}>{idx + 1}</Text>
                  </View>
                  <Text style={[styles.sourceName, { color: theme.textColor }]}>{src.documentName}</Text>
                  <View style={[styles.scorePill, { backgroundColor: theme.accentBg }]}>
                    <Text style={[styles.scoreText, { color: theme.isDark ? "#579360" : "#265834" }]}>
                      {(src.score * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
                <Text style={[styles.sourceExcerpt, { color: theme.muted }]} numberOfLines={2}>
                  {src.excerpt}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Answer */}
        {answer && (
          <View style={[styles.answerCard, { backgroundColor: theme.cardBg }, theme.shadowStyle]}>
            <Text style={[styles.answerHeader, { color: theme.secondaryText }]}>ANSWER</Text>
            <Text style={[styles.answerText, { color: theme.textColor }]}>{answer}</Text>

            {sources.length > 0 && (
              <View style={[styles.footerSources, { borderTopColor: theme.borderColor }]}>
                <Text style={[styles.footerSourcesLabel, { color: theme.muted }]}>Sources</Text>
                {sources.map((src, idx) => (
                  <View key={idx} style={styles.footerSourceRow}>
                    <Text style={[styles.footerNum, { color: theme.isDark ? "#579360" : "#265834" }]}>[{idx + 1}]</Text>
                    <Text style={[styles.footerDoc, { color: theme.secondaryText }]}>
                      {src.documentName}, Chunk #{src.chunkIndex}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {currentStep === "done" && (
          <TouchableOpacity
            style={[styles.newQuestionBtn, { borderColor: theme.borderColor }]}
            onPress={() => {
              setCurrentStep("idle");
              setAnswer(null);
              setSources([]);
              setQuestion("");
            }}
          >
            <Text style={[styles.newQuestionText, { color: theme.secondaryText }]}>Ask another question</Text>
          </TouchableOpacity>
        )}

        {/* Empty state */}
        {currentStep === "idle" && !question && (
          <EmptyState
            icon="search"
            title="Ask a question"
            description="The AI will search your knowledge base and answer with citations from your documents."
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { paddingRight: 12 },
  title: { fontSize: 20, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 1 },
  body: { flex: 1 },
  bodyContent: { padding: 24 },

  inputRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    borderWidth: 1,
    minHeight: 52,
  },
  sendBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },

  suggestions: {
    gap: 8,
    marginBottom: 24,
  },
  suggestionPill: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  suggestionText: { fontSize: 14 },

  pipelineCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 2,
  },
  pipelineTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },

  sourcesCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sourcesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sourcesTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  source: {
    paddingVertical: 10,
  },
  sourceTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sourceNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  sourceNumText: { fontSize: 10, fontWeight: "700" },
  sourceName: { fontSize: 14, fontWeight: "600", flex: 1 },
  scorePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  scoreText: { fontSize: 11, fontWeight: "700" },
  sourceExcerpt: { fontSize: 12, lineHeight: 17, paddingLeft: 30 },

  answerCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  answerHeader: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
  },
  answerText: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
  },
  footerSources: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  footerSourcesLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
  },
  footerSourceRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 3,
  },
  footerNum: { fontSize: 12, fontWeight: "600" },
  footerDoc: { fontSize: 12 },

  newQuestionBtn: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  newQuestionText: { fontSize: 14, fontWeight: "600" },
});
