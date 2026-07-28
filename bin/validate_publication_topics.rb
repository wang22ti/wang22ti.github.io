#!/usr/bin/env ruby

require "yaml"

ROOT = File.expand_path("..", __dir__)
ABOUT_PATH = File.join(ROOT, "_pages", "about.md")
TOPICS_PATH = File.join(ROOT, "_data", "publication_topics.yml")
PUBLICATIONS_HEADING = "# 📝 Publications"

def normalize_id(value)
  value.to_s.gsub(/\s+/, " ").strip
end

about = File.read(ABOUT_PATH, encoding: "UTF-8")
publications = about.split(PUBLICATIONS_HEADING, 2)[1]

unless publications
  warn "Publication validation failed: #{PUBLICATIONS_HEADING.inspect} was not found."
  exit 1
end

homepage_ids = publications.each_line.filter_map do |line|
  match = line.match(/^\[(.+)\]\(https?:\/\/.+\)\s*$/)
  normalize_id(match[1]) if match
end

metadata = YAML.safe_load(File.read(TOPICS_PATH, encoding: "UTF-8"), aliases: false)
metadata_ids = Array(metadata).map { |entry| normalize_id(entry["id"]) }

errors = []

homepage_duplicates = homepage_ids.tally.select { |_id, count| count > 1 }
metadata_duplicates = metadata_ids.tally.select { |_id, count| count > 1 }
missing_metadata = homepage_ids - metadata_ids
orphaned_metadata = metadata_ids - homepage_ids
blank_metadata_ids = metadata_ids.select(&:empty?)

homepage_duplicates.each do |id, count|
  errors << "Homepage title appears #{count} times: #{id}"
end

metadata_duplicates.each do |id, count|
  errors << "Metadata ID appears #{count} times: #{id}"
end

missing_metadata.each do |id|
  errors << "Homepage publication has no metadata: #{id}"
end

orphaned_metadata.each do |id|
  errors << "Metadata has no homepage publication: #{id}"
end

errors << "Metadata contains #{blank_metadata_ids.length} blank ID(s)." unless blank_metadata_ids.empty?

unless errors.empty?
  warn "Publication validation failed:"
  errors.each { |error| warn "  - #{error}" }
  exit 1
end

puts "Validated #{homepage_ids.length} publication topic mappings."
