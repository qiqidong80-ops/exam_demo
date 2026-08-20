import random
from api.routes_class import classes_store
from api.store import papers_store

results_store: dict[str, list] = {}


def _mock_score() -> int:
    return max(0, min(100, round(random.gauss(72, 15))))


def _mock_correctness(score: int, n_questions: int) -> list[int]:
    p = score / 100
    return [1 if random.random() < p else 0 for _ in range(n_questions)]


def _get_question_count(exam: dict) -> int:
    paper = papers_store.get(exam.get("paper_id", ""))
    if paper:
        return len(paper.get("questions", []))
    return 5  # 默认题目数（试卷已丢失时兜底）


def ensure_results(exam: dict) -> list[dict]:
    if exam["id"] in results_store:
        return results_store[exam["id"]]
    students = []
    for cid in exam.get("class_ids", []):
        cls = classes_store.get(cid)
        if cls:
            for name in cls["students"]:
                students.append((name, cid))
    n_q = _get_question_count(exam)
    results = []
    for name, cid in students:
        score = _mock_score()
        results.append({
            "student_name": name,
            "class_id": cid,
            "score": score,
            "question_correctness": _mock_correctness(score, n_q),
        })
    results_store[exam["id"]] = results
    return results


def build_report(exam: dict) -> dict:
    results = ensure_results(exam)
    n = len(results)
    base = {
        "exam_id": exam["id"],
        "exam_name": exam["name"],
        "exam_code": exam["exam_code"],
        "participant_count": n,
    }
    if n == 0:
        return {**base, "avg_score": 0, "pass_rate": 0, "max_score": 0,
                "min_score": 0, "score_distribution": [0, 0, 0, 0, 0],
                "question_correctness": [], "students": []}

    scores = [r["score"] for r in results]
    avg = round(sum(scores) / n, 1)
    pass_rate = round(sum(1 for s in scores if s >= 60) / n, 2)
    buckets = [0, 0, 0, 0, 0]
    for s in scores:
        if s < 20: buckets[0] += 1
        elif s < 40: buckets[1] += 1
        elif s < 60: buckets[2] += 1
        elif s < 80: buckets[3] += 1
        else: buckets[4] += 1
    n_q = len(results[0]["question_correctness"]) if results else 0
    qc = []
    for i in range(n_q):
        correct = sum(1 for r in results if r["question_correctness"][i] == 1)
        qc.append(round(correct / n, 2))
    students = [{"student_name": r["student_name"], "score": r["score"]} for r in results]
    return {
        **base,
        "avg_score": avg,
        "pass_rate": pass_rate,
        "max_score": max(scores),
        "min_score": min(scores),
        "score_distribution": buckets,
        "question_correctness": qc,
        "students": students,
    }
