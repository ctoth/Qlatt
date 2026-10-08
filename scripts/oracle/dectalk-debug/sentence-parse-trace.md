# Tracing DECtalk's sentence parse (inserted clause breaks)

For the question "which words did DECtalk's text stage mark in this stretch of
text, and where did it set a break". The port's side of the same question is
`scripts/oracle/dump-words.ts --text "..."` (each Word's place in its stretch,
`break_marker`, `conjunction_sequence`, `clause_break_before`).

Work in a private **copy** of a built DECtalk tree, as `README.md` in this
directory says. To force a recompile delete
`dapi/build/dtstatic/us/release/link/lsa_task.obj` (`ls_task.c` is compiled
through `lsa_task.c`) and `samples/SAY/build/us/static/say.exe`.

## What is traced

`ls_task_parse_sentence` (`LTS/ls_task.c:5043-5230`) runs once for each
stretch of text the text stage is handed: up to a space after one of
`! ' , - . : ;  ?` (`ls_task.c:362-368`, `CMD/cm_char.c` `MARK_clause`), or the
flush character at a text's end. It gives every word a slot, from 1, with

- `fc_struct[i]`: the word's form class as the dictionary lookup of that
  moment has it;
- `pro_markers[i]`: the low 24 bits are the marks (`LTS/ls_data.h:126-138`:
  conjunction `0x20`, preposition `0x80`, "that" `0x100`, first word of a
  conjunction of several words `0x200`, a dash `0x10`), with an optional break
  `0x00400000` or a required one `0x00800000`; the top byte is the word's index
  in `LTS/proverbs.h` (`scripts/oracle/dectalk-debug/dump-proverbs.ts` prints
  that table), or `0xff` for a later word of such a conjunction.

A break becomes a COMMA before a word when the word's class is sent and
`length > fc_index + 3` (`LTS/ls_util.c:820-848`); `length` is the number of
slots.

## The print

In `LTS/ls_task.c`, in `ls_task_parse_sentence`, after the loop that sets the
breaks and before the `#endif` that follows it (line 5232 of the unmodified
file):

```c
{
	const char *qph_path = getenv("QPH_TRACE");
	if (qph_path)
	{
		FILE *qph_file = fopen(qph_path, "a");
		if (qph_file)
		{
			int qph_i;
			fprintf(qph_file, "P text=");
			for (qph_i=0;qph_i<pLts_t->cur_input_pos;qph_i++)
			{
				int qph_c = pLts_t->input_array[qph_i] & 0xff;
				fprintf(qph_file, "%c", (qph_c >= 0x20 && qph_c < 0x7f) ? qph_c : '~');
			}
			fprintf(qph_file, "| length=%d fc_index=%d\n", pLts_t->length, pLts_t->fc_index);
			for (qph_i=0;qph_i<pLts_t->fc_index;qph_i++)
			{
				fprintf(qph_file, "P i=%d m=%08x fc=%08x\n", qph_i, (unsigned)pLts_t->pro_markers[qph_i], (unsigned)pLts_t->fc_struct[qph_i]);
			}
			fclose(qph_file);
		}
	}
}
```

The file named by `QPH_TRACE` is appended to: give each run its own.

## What it showed

- "Milk bread eggs and a dozen apples": `length=8` for seven words (the flush
  character makes a slot), so the break before "and" (slot 4) is sent; with a
  period at the end `length=7` and it is not.
- "The old bag weighs 5 lb. and the small one weighs less today.": two
  stretches, six and seven slots; "and" is slot 1 of the second.
- "as soon as the": slot "as" `10800220`, then `ff000020` three times, the
  word after the three-word conjunction included.
- Quotes and brackets never reach the parse: the command parser has removed
  them from the text.
- The break test reads `pro_markers[fc_index]`, and a word that a number
  routine reads ahead ("am" after "9", "million" after "$2") does not advance
  `fc_index`: in "…opens 9 am and the small one closes late today." the comma
  comes after "and".
