// Video Generation API (Protected)
app.post("/api/video/generate", authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Usuário não autenticado" });

    const params: GenerateVideoParams = req.body;
    if (!params.prompt) {
      return res.status(400).json({ error: "Prompt é obrigatório" });
    }

    // ✅ Deduz créditos conforme a resolução
    const deductResult = await deductCredits(
      req.user.id,
      params.resolution === "4k" ? "video4k" : "video"
    );
    if (!deductResult.success) {
      return res.status(402).json(deductResult);
    }

    // ✅ Usa o service correto
    const result = params.resolution === "4k"
      ? await generate4kVideo(req.user.id, params as Generate4kVideoParams)
      : await generateStandardVideo(req.user.id, params);

    res.json({ ...result, creditsRemaining: deductResult.creditsRemaining });
  } catch (error) {
    console.error("Video generation error:", error);
    const message = error instanceof Error ? error.message : "Erro ao gerar vídeo";
    res.status(500).json({ error: message });
  }
});
