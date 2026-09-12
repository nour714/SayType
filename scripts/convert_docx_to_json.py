import sys
import os
import re
import json
import docx

# Set UTF-8 encoding for stdout
sys.stdout.reconfigure(encoding='utf-8')

# Paths
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCX_PATH = os.path.join(ROOT_DIR, '500_English_Sentences_Arabic.docx')
A1_PATH = os.path.join(ROOT_DIR, 'server', 'data', 'sentences.a1.json')
A2_PATH = os.path.join(ROOT_DIR, 'server', 'data', 'sentences.a2.json')
DICT_SERVICE_PATH = os.path.join(ROOT_DIR, 'client', 'js', 'services', 'DictionaryService.js')

# 1. Build lexicon from existing sentences and DictionaryService
lexicon = {}

def load_existing_lexicon():
    global lexicon
    for p in [A1_PATH, A2_PATH]:
        if os.path.exists(p):
            try:
                with open(p, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for item in data:
                        for w in item.get('words', []):
                            word_key = w.get('word', '').strip().lower()
                            if word_key and word_key not in lexicon:
                                lexicon[word_key] = {
                                    'translation': w.get('translation', ''),
                                    'partOfSpeech': w.get('partOfSpeech', 'word'),
                                    'pronunciation': w.get('pronunciation', f"/{word_key}/")
                                }
            except Exception as e:
                print(f"Warning reading {p}: {e}")

    # Also parse DictionaryService fallbackLexicon
    if os.path.exists(DICT_SERVICE_PATH):
        try:
            with open(DICT_SERVICE_PATH, 'r', encoding='utf-8') as f:
                content = f.read()
            pattern = re.compile(
                r"(\b[a-zA-Z\'-]+):\s*\{\s*translation:\s*['\"]([^'\"]+)['\"],\s*pronunciation:\s*['\"]([^'\"]+)['\"],\s*partOfSpeech:\s*['\"]([^'\"]+)['\"]",
                re.MULTILINE
            )
            for match in pattern.finditer(content):
                w, tr, pr, pos = match.groups()
                w_lower = w.lower()
                if w_lower not in lexicon:
                    lexicon[w_lower] = {
                        'translation': tr,
                        'pronunciation': pr,
                        'partOfSpeech': pos
                    }
        except Exception as e:
            print(f"Warning reading DictionaryService: {e}")

load_existing_lexicon()
print(f"Loaded {len(lexicon)} words into master lexicon.")

# 2. Parse sentences from DOCX
doc = docx.Document(DOCX_PATH)
lines = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

pairs = []
i = 0
while i < len(lines):
    line = lines[i]
    m = re.match(r'^(\d+)\.\s*(.*)$', line)
    if m:
        num = int(m.group(1))
        en = m.group(2).strip()
        # Ensure it contains English alphabetic characters and not Arabic heading
        if any(c.isascii() and c.isalpha() for c in en):
            if i + 1 < len(lines):
                ar = lines[i + 1].strip()
                pairs.append((num, en, ar))
                i += 2
                continue
    i += 1

print(f"Extracted {len(pairs)} sentence pairs from DOCX.")
if len(pairs) != 500:
    raise ValueError(f"Expected 500 pairs, but found {len(pairs)}!")

# Section definitions (50 sentences each)
SECTIONS = [
    # A1 (1 - 250)
    {
        'range': (1, 50),
        'level': 'A1',
        'topic': 'greetings',
        'topic_label': 'Greetings & Introductions',
        'tags': ['greetings', 'introductions']
    },
    {
        'range': (51, 100),
        'level': 'A1',
        'topic': 'daily-life',
        'topic_label': 'Daily Life & Routine',
        'tags': ['daily-life', 'routine']
    },
    {
        'range': (101, 150),
        'level': 'A1',
        'topic': 'work-study',
        'topic_label': 'Study & Work',
        'tags': ['study', 'work']
    },
    {
        'range': (151, 200),
        'level': 'A1',
        'topic': 'shopping-food',
        'topic_label': 'Shopping & Food',
        'tags': ['shopping', 'food']
    },
    {
        'range': (201, 250),
        'level': 'A1',
        'topic': 'travel',
        'topic_label': 'Travel & Transport',
        'tags': ['travel', 'transport']
    },
    # A2 (251 - 500)
    {
        'range': (251, 300),
        'level': 'A2',
        'topic': 'feelings-opinions',
        'topic_label': 'Feelings & Opinions',
        'tags': ['feelings', 'opinions']
    },
    {
        'range': (301, 350),
        'level': 'A2',
        'topic': 'health',
        'topic_label': 'Health & Help',
        'tags': ['health', 'help']
    },
    {
        'range': (351, 400),
        'level': 'A2',
        'topic': 'technology',
        'topic_label': 'Technology & Internet',
        'tags': ['technology', 'internet']
    },
    {
        'range': (401, 450),
        'level': 'A2',
        'topic': 'plans-conversations',
        'topic_label': 'Plans & Conversations',
        'tags': ['plans', 'conversations']
    },
    {
        'range': (451, 500),
        'level': 'A2',
        'topic': 'general',
        'topic_label': 'General Essentials',
        'tags': ['general', 'essentials']
    }
]

def tokenize_words(text_en):
    tokens = re.findall(r"\b[A-Za-z]+(?:'[A-Za-z]+)?\b", text_en)
    seen = set()
    words = []
    for token in tokens:
        lower = token.lower()
        if lower in seen:
            continue
        seen.add(lower)
        if lower in lexicon:
            info = lexicon[lower]
            words.append({
                'word': lower,
                'translation': info['translation'],
                'partOfSpeech': info['partOfSpeech'],
                'pronunciation': info['pronunciation']
            })
        else:
            words.append({
                'word': lower,
                'translation': '',
                'partOfSpeech': 'word',
                'pronunciation': f"/{lower}/"
            })
    return words

a1_sentences = []
a2_sentences = []

for num, en, ar in pairs:
    # Find matching section
    matched_sec = None
    for sec in SECTIONS:
        start, end = sec['range']
        if start <= num <= end:
            matched_sec = sec
            break
    if not matched_sec:
        raise ValueError(f"No section for sentence #{num}")

    level = matched_sec['level']
    topic = matched_sec['topic']
    topic_label = matched_sec['topic_label']
    tags = matched_sec['tags']

    # Index within topic (1-50)
    topic_index = num - matched_sec['range'][0] + 1
    sentence_id = f"{level.lower()}-{topic}-{topic_index:03d}"

    sentence_obj = {
        'id': sentence_id,
        'level': level,
        'topic': topic,
        'topic_label': topic_label,
        'text_en': en,
        'text_ar': ar,
        'english': en,
        'arabic': ar,
        'tags': list(tags),
        'words': tokenize_words(en)
    }

    if level == 'A1':
        a1_sentences.append(sentence_obj)
    else:
        a2_sentences.append(sentence_obj)

print(f"Generated {len(a1_sentences)} A1 sentences.")
print(f"Generated {len(a2_sentences)} A2 sentences.")

# Write to JSON files
with open(A1_PATH, 'w', encoding='utf-8') as f:
    json.dump(a1_sentences, f, ensure_ascii=False, indent=2)

with open(A2_PATH, 'w', encoding='utf-8') as f:
    json.dump(a2_sentences, f, ensure_ascii=False, indent=2)

print(f"Successfully saved {A1_PATH} and {A2_PATH}!")
