import os
import uvicorn
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM

# Pin a revision to prevent repeated downloads on each run
PINNED_REVISION = "main"  # You can set this to a commit, tag, or branch that’s known to work

# Set up a mapping of keys to lightweight models you want to try.
MODEL_MAP = {
    "deepseek-chat": "deepseek-ai/DeepSeek-V2-Chat",
    "deepseek-llm":  "deepseek-ai/DeepSeek-LLM-7b-base",
    "deepseek-coder": "deepseek-ai/DeepSeek-Coder-V2-Base"
}

class PromptRequest(BaseModel):
    prompt: str

class CompletionResponse(BaseModel):
    answer: str

app = FastAPI()

@app.get("/api")
async def api_info():
    return {"message": "This is Kartavya's DeepSeek Server using a lightweight model."}

# Determine model to load from environment (with a default)
model_key = os.getenv("MODEL_NAME", "deepseek-chat")
model_id = MODEL_MAP.get(model_key, model_key)  # Allow full repo name as fallback

# Load tokenizer and model; models are cached so downloads only occur once.
tokenizer = AutoTokenizer.from_pretrained(
    model_id,
    trust_remote_code=True,
    revision=PINNED_REVISION
)

use_gpu = os.getenv("GPU_ACCELERATION", "false").lower() == "true"
if use_gpu and torch.cuda.is_available():
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        trust_remote_code=True,
        revision=PINNED_REVISION,
        device_map="auto"
    )
else:
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        trust_remote_code=True,
        revision=PINNED_REVISION,
        device_map={"": "cpu"}
    )
    model.to("cpu")

@app.post("/completion", response_model=CompletionResponse)
async def generate_completion(request: PromptRequest):
    prompt = request.prompt
    print(f"Received prompt: {prompt}")
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    try:
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
        outputs = model.generate(**inputs, max_new_tokens=150)
        text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        print(f"Generated response: {text}")
        return {"answer": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    # Start the Uvicorn server on port 8000.
    uvicorn.run("app:app", host="127.0.0.1", port=8001, reload=False)