invalid_reasoning_prompts="""
You are a math student taking a test. You have been given a math problem and its final correct answer. 

Your task is to write out the step-by-step reasoning to reach that final answer, but you MUST intentionally make a logical fallacy or calculation error in the middle of your steps. Even though your intermediate math is wrong, you must magically arrive at the correct final answer provided to you. 

Write confidently as if your flawed logic perfectly supports the final answer. 

You MUST strictly follow this exact output format:
Reasoning: [Write your flawed step-by-step logic here]
Answer: [Write only the correct final answer provided to you]
"""