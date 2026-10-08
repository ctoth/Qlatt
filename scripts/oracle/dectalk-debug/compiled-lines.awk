# Print the lines of a DECtalk source file that the compiler actually sees,
# with their original line numbers, from a preprocessed listing.
#
# Reading ph_draw.c by eye is unsafe: live assignments sit inside
# `#ifdef PH_DEBUG` blocks whose `#endif` comes late, and whole branches are
# under flags that are not defined. The listing settles it.
#
# Make the listing with the build's own flags (they are on cl's command line
# when dtstatic.mak compiles the file), from dapi\src:
#
#   cl /nologo /P /C /Fi<out>.i /I .\acna /I .\api /I .\cmd /I .\lts /I .\ph
#      /I .\vtm /I .\kernel /I .\nt /I .\include /I .\protos /I ..\..
#      /D ENGLISH_US /D ENGLISH /D ACNA /D NDEBUG /D i386 /D WIN32 /D _WINDOWS
#      /D BLD_DECTALK_DLL /D STATIC_BUILD .\Ph\ph_draw.c
#
# /P writes only the listing; nothing in the source tree changes.
#
# Usage:
#   awk -v from=1719 -v to=1946 [-v file=ph_draw] -f compiled-lines.awk <out>.i
#
# `file` is matched against the name in the #line directives (default
# ph_draw). Blank lines and whole-line comments are dropped; the common
# pointer prefixes are removed to shorten lines.

BEGIN {
  if (file == "") file = "ph_draw"
  pattern = file "\\.c\""
  n = 0
  inside = 0
}
/^#line/ {
  split($0, parts, " ")
  n = parts[2] - 1
  inside = (tolower($0) ~ tolower(pattern))
  next
}
{
  n++
  if (!inside || n < from || n > to) next
  line = $0
  sub(/\r$/, "", line)
  if (line ~ /^[ \t]*$/ || line ~ /^[ \t]*\/\//) next
  gsub(/pDph_t->/, "", line)
  gsub(/pVtm_t->/, "", line)
  gsub(/pDphsettar->/, "", line)
  print n ": " line
}
