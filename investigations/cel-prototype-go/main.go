package main

import (
	"fmt"
	"log"

	"github.com/google/cel-go/cel"
	"github.com/google/cel-go/checker/decls"
	"github.com/google/cel-go/common/types"
	"github.com/google/cel-go/common/types/ref"
	"github.com/google/cel-go/ext"
	"github.com/google/cel-go/interpreter/functions"
)

type Token struct {
	ID          string
	Name        string
	F           map[string]string
	S           map[string]float64
	Parent      *Token
	Assoc       map[string][]*Token
	StreamIndex int
}

func tokenView(t *Token) map[string]any {
	return map[string]any{
		"id":   t.ID,
		"name": t.Name,
		"f":    t.F,
		"s":    t.S,
		"_ref": t,
	}
}

func tokenFromVal(v ref.Val) (*Token, error) {
	m, ok := v.Value().(map[string]any)
	if !ok {
		return nil, fmt.Errorf("expected token view map, got %T", v.Value())
	}
	refAny, ok := m["_ref"]
	if !ok {
		return nil, fmt.Errorf("missing _ref on token view")
	}
	t, ok := refAny.(*Token)
	if !ok {
		return nil, fmt.Errorf("_ref not *Token: %T", refAny)
	}
	return t, nil
}

func main() {
	stream := []*Token{}
	mk := func(id, name, manner, backness string) *Token {
		t := &Token{
			ID:   id,
			Name: name,
			F: map[string]string{
				"manner":   manner,
				"backness": backness,
			},
			S:     map[string]float64{},
			Assoc: map[string][]*Token{},
		}
		stream = append(stream, t)
		t.StreamIndex = len(stream) - 1
		return t
	}

	kcl := mk("t1", "K_CL", "stop", "back")
	rel := mk("t2", "K_REL", "release", "back")
	vowel := mk("t3", "AE", "vowel", "front")

	syll := mk("s1", "syll", "span", "")
	vowel.Parent = syll

	tone := mk("tone1", "H", "tone", "")
	vowel.Assoc["tone"] = []*Token{tone}

	current := tokenView(kcl)

	parentFn := functions.FunctionOp(func(vals ...ref.Val) ref.Val {
		t, err := tokenFromVal(vals[0])
		if err != nil {
			return types.NewErr(err.Error())
		}
		_ = vals[1].Value().(string) // stream name unused in this mock
		if t.Parent == nil {
			return types.NullValue
		}
		return types.DefaultTypeAdapter.NativeToValue(tokenView(t.Parent))
	})

	followingFn := functions.FunctionOp(func(vals ...ref.Val) ref.Val {
		t, err := tokenFromVal(vals[0])
		if err != nil {
			return types.NewErr(err.Error())
		}
		kind, _ := vals[1].Value().(string)
		for i := t.StreamIndex + 1; i < len(stream); i++ {
			next := stream[i]
			if next.F["manner"] == kind {
				return types.DefaultTypeAdapter.NativeToValue(tokenView(next))
			}
		}
		return types.NullValue
	})

	assocFn := functions.FunctionOp(func(vals ...ref.Val) ref.Val {
		t, err := tokenFromVal(vals[0])
		if err != nil {
			return types.NewErr(err.Error())
		}
		name, _ := vals[1].Value().(string)
		list := t.Assoc[name]
		out := make([]any, 0, len(list))
		for _, item := range list {
			out = append(out, tokenView(item))
		}
		return types.DefaultTypeAdapter.NativeToValue(out)
	})

	env, err := cel.NewEnv(
		ext.Bindings(),
		cel.Declarations(
			decls.NewVar("current", decls.Dyn),
		),
		cel.Function("parent",
			cel.MemberOverload("token_parent", []*cel.Type{cel.DynType, cel.StringType}, cel.DynType, cel.FunctionBinding(parentFn)),
		),
		cel.Function("following",
			cel.MemberOverload("token_following", []*cel.Type{cel.DynType, cel.StringType}, cel.DynType, cel.FunctionBinding(followingFn)),
		),
		cel.Function("assoc",
			cel.MemberOverload("token_assoc", []*cel.Type{cel.DynType, cel.StringType}, cel.ListType(cel.DynType), cel.FunctionBinding(assocFn)),
		),
	)
	if err != nil {
		log.Fatal(err)
	}

	expressions := []string{
		`current.following("vowel").f.backness`,
		`current.following("vowel") == null ? false : current.following("vowel").f.manner == "vowel"`,
		`cel.bind(f2, current.following("vowel").f.backness == "front" ? 1200 : 1900, f2)`,
		`size(current.following("vowel").assoc("tone"))`,
	}

	for _, src := range expressions {
		ast, iss := env.Parse(src)
		if iss.Err() != nil {
			fmt.Printf("parse error: %v\n", iss.Err())
			continue
		}
		checked, iss := env.Check(ast)
		if iss.Err() != nil {
			fmt.Printf("check error: %v\n", iss.Err())
			continue
		}
		prg, err := env.Program(checked)
		if err != nil {
			fmt.Printf("program error: %v\n", err)
			continue
		}
		out, _, err := prg.Eval(map[string]any{"current": current})
		if err != nil {
			fmt.Printf("eval error: %v\n", err)
			continue
		}
		fmt.Printf("%s => %v\n", src, out)
	}

	// Demonstrate parent() null handling on a token with no parent
	orphan := tokenView(rel)
	ast, _ := env.Parse(`current.parent("syllable") == null ? "none" : current.parent("syllable").f.stress`)
	prg, _ := env.Program(ast)
	out, _, _ := prg.Eval(map[string]any{"current": orphan})
	fmt.Printf("orphan parent => %v\n", out)
}
